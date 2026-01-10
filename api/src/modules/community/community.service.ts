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
export class CommunityService {
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
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
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
        category: post.category,
        views: post.views,
        replies: post._count.replies,
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

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author.username || 'Anonymous',
      authorId: post.author.id,
      category: post.category,
      views: post.views + 1, // Include the increment we just did
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

    const post = await this.prisma.communityPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category,
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

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author.username || 'Anonymous',
      category: post.category,
      views: post.views,
      replies: 0,
      pinned: post.pinned,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  /**
   * Create a reply to a post
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
   * Delete a post (only author or admin)
   */
  async deletePost(postId: string, userId: string, userRole: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check authorization
    if (post.authorId !== userId && !['admin', 'main_admin'].includes(userRole)) {
      throw new UnauthorizedException('You do not have permission to delete this post');
    }

    await this.prisma.communityPost.delete({
      where: { id: postId },
    });

    return { success: true };
  }

  /**
   * Delete a reply (only author or admin)
   */
  async deleteReply(replyId: string, userId: string, userRole: string) {
    const reply = await this.prisma.communityReply.findUnique({
      where: { id: replyId },
      select: { authorId: true },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    // Check authorization
    if (reply.authorId !== userId && !['admin', 'main_admin'].includes(userRole)) {
      throw new UnauthorizedException('You do not have permission to delete this reply');
    }

    await this.prisma.communityReply.delete({
      where: { id: replyId },
    });

    return { success: true };
  }
}
