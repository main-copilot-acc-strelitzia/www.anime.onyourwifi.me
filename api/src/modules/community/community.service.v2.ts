import { Injectable, Inject, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface CreatePostInput {
  title: string;
  content: string;
  category: string;
  authorId: string;
}

interface CreateReplyInput {
  postId: string;
  content: string;
  authorId: string;
}

interface GetPostsInput {
  category?: string;
  search?: string;
  skip?: number;
  take?: number;
}

@Injectable()
export class CommunityServiceV2 {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get posts with filtering
   */
  async getPosts(input: GetPostsInput) {
    const { category, search, skip = 0, take = 20 } = input;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          mainModerator: {
            select: {
              id: true,
              username: true,
            },
          },
          moderators: {
            select: {
              id: true,
              username: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: [{ pinned: 'desc' }, { lastActivityAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return {
      data: posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        author: post.author.username || 'Anonymous',
        authorId: post.author.id,
        mainModerator: post.mainModerator?.username || post.author.username || 'Anonymous',
        mainModeratorId: post.mainModerator?.id || post.author.id,
        moderators: post.moderators.map((m) => ({ id: m.id, username: m.username })),
        category: post.category,
        views: post.views,
        replies: post._count.replies || post.replyCount,
        pinned: post.pinned,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })),
      pagination: {
        total,
        page: Math.floor(skip / take) + 1,
        pageSize: take,
        pages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get a single post with its replies
   */
  async getPost(postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        mainModerator: {
          select: {
            id: true,
            username: true,
          },
        },
        moderators: {
          select: {
            id: true,
            username: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      return null;
    }

    // Increment view count
    await this.prisma.communityPost.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });

    // Update last activity
    await this.prisma.communityPost.update({
      where: { id: postId },
      data: { lastActivityAt: new Date() },
    });

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author.username || 'Anonymous',
      authorId: post.author.id,
      mainModerator: post.mainModerator?.username || post.author.username,
      mainModeratorId: post.mainModerator?.id || post.author.id,
      moderators: post.moderators.map((m) => ({ id: m.id, username: m.username })),
      category: post.category,
      views: post.views + 1,
      replies: post.replies.length,
      pinned: post.pinned,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      replies: post.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        author: reply.author.username || 'Anonymous',
        authorId: reply.author.id,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      })),
    };
  }

  /**
   * Create a new post
   * Initially author is the main moderator, along with main_admin
   */
  async createPost(input: CreatePostInput) {
    const { title, content, category, authorId } = input;

    // Validate input
    if (!title || title.trim().length === 0) {
      throw new BadRequestException('Post title is required');
    }
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Post content is required');
    }
    if (title.length > 255) {
      throw new BadRequestException('Title must be 255 characters or less');
    }
    if (content.length > 10000) {
      throw new BadRequestException('Content must be 10000 characters or less');
    }

    // Valid categories
    const validCategories = ['general', 'anime', 'support', 'events', 'off-topic'];
    if (!validCategories.includes(category)) {
      throw new BadRequestException('Invalid category');
    }

    // Get the main_admin user
    const mainAdmin = await this.prisma.user.findFirst({
      where: { role: 'main_admin' },
      select: { id: true },
    });

    if (!mainAdmin) {
      throw new BadRequestException('No main admin found');
    }

    const post = await this.prisma.communityPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category,
        authorId,
        mainModeratorId: authorId, // Author is initially the moderator
        moderators: {
          connect: [{ id: authorId }, { id: mainAdmin.id }], // Both author and main_admin are moderators
        },
        lastActivityAt: new Date(),
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        moderators: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author.username || 'Anonymous',
      category: post.category,
      views: post.views,
      replies: 0,
      pinned: post.pinned,
      moderators: post.moderators.map((m) => ({ id: m.id, username: m.username })),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  /**
   * Create a reply to a post
   * Updates post's lastActivityAt
   */
  async createReply(input: CreateReplyInput) {
    const { postId, content, authorId } = input;

    // Validate input
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Reply content is required');
    }
    if (content.length > 5000) {
      throw new BadRequestException('Content must be 5000 characters or less');
    }

    // Check if post exists
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const reply = await this.prisma.communityReply.create({
      data: {
        content: content.trim(),
        postId,
        authorId,
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    // Update post's reply count and last activity
    await this.prisma.communityPost.update({
      where: { id: postId },
      data: {
        replyCount: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    // Check if author should become moderator (if current moderator left)
    await this.updateModeratorIfNeeded(postId, authorId);

    return {
      id: reply.id,
      content: reply.content,
      author: reply.author.username || 'Anonymous',
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    };
  }

  /**
   * Get all replies for a post
   */
  async getReplies(postId: string) {
    const replies = await this.prisma.communityReply.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      data: replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        author: reply.author.username || 'Anonymous',
        authorId: reply.author.id,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      })),
    };
  }

  /**
   * Delete a post (only author, moderator, or admin)
   */
  async deletePost(postId: string, userId: string, userRole: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { authorId: true, moderators: { select: { id: true } } },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isModerator = post.moderators.some((m) => m.id === userId);
    const isAuthor = post.authorId === userId;

    // Check authorization: author, moderator, or admin
    if (!isAuthor && !isModerator && !['admin', 'main_admin'].includes(userRole)) {
      throw new UnauthorizedException('You do not have permission to delete this post');
    }

    await this.prisma.communityPost.delete({
      where: { id: postId },
    });

    return { success: true };
  }

  /**
   * Delete a reply (only author, post moderator, or admin)
   */
  async deleteReply(replyId: string, userId: string, userRole: string) {
    const reply = await this.prisma.communityReply.findUnique({
      where: { id: replyId },
      select: { authorId: true, post: { select: { moderators: { select: { id: true } } } } },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    const isPostModerator = reply.post.moderators.some((m) => m.id === userId);
    const isAuthor = reply.authorId === userId;

    // Check authorization: author, post moderator, or admin
    if (!isAuthor && !isPostModerator && !['admin', 'main_admin'].includes(userRole)) {
      throw new UnauthorizedException('You do not have permission to delete this reply');
    }

    await this.prisma.communityReply.delete({
      where: { id: replyId },
    });

    return { success: true };
  }

  /**
   * Helper: Check if moderator left and update to most active user
   */
  private async updateModeratorIfNeeded(postId: string, authorId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: {
        mainModerator: { select: { isActive: true } },
        moderators: { select: { id: true, isActive: true } },
      },
    });

    if (!post) return;

    // If main moderator is still active, no need to change
    if (post.mainModerator?.isActive) {
      return;
    }

    // Find most active user in replies (by counting their replies)
    const replyAuthorCounts = await this.prisma.communityReply.groupBy({
      by: ['authorId'],
      where: { postId },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 1,
    });

    if (replyAuthorCounts.length > 0) {
      const mostActiveUserId = replyAuthorCounts[0].authorId;
      await this.prisma.communityPost.update({
        where: { id: postId },
        data: {
          mainModeratorId: mostActiveUserId,
        },
      });
    }
  }

  /**
   * Get count of moderators for a post
   */
  async getPostModerators(postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: {
        moderators: {
          select: {
            id: true,
            username: true,
            isActive: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      count: post.moderators.length,
      moderators: post.moderators,
    };
  }
}
