import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt.guard';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('community')
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  /**
   * GET /community/posts
   * Get all community posts with optional filtering
   */
  @Get('posts')
  async getPosts(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    if (limit > 100) limit = 100; // Max limit safety
    if (page < 1) page = 1;

    const skip = (page - 1) * limit;

    return this.communityService.getPosts({
      category,
      search,
      skip,
      take: limit,
    });
  }

  /**
   * GET /community/posts/:id
   * Get a specific post with replies
   */
  @Get('posts/:id')
  async getPost(@Param('id') id: string) {
    const post = await this.communityService.getPost(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  /**
   * POST /community/posts
   * Create a new community post (requires authentication)
   */
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPost(@Body() dto: CreatePostDto, @Req() req: RequestWithUser) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.communityService.createPost({
      title: dto.title,
      content: dto.content,
      category: dto.category || 'general',
      authorId: req.user.id,
    });
  }

  /**
   * POST /community/posts/:id/replies
   * Create a reply to a post (requires authentication)
   */
  @Post('posts/:id/replies')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReply(@Param('id') postId: string, @Body() dto: CreateReplyDto, @Req() req: RequestWithUser) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.communityService.createReply({
      postId,
      content: dto.content,
      authorId: req.user.id,
    });
  }

  /**
   * GET /community/posts/:id/replies
   * Get all replies for a post
   */
  @Get('posts/:id/replies')
  async getReplies(@Param('id') postId: string) {
    return this.communityService.getReplies(postId);
  }

  /**
   * DELETE /community/posts/:id
   * Delete a post (only author or admin)
   */
  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deletePost(@Param('id') id: string, @Req() req: RequestWithUser) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.communityService.deletePost(id, req.user.id, req.user.role);
  }

  /**
   * DELETE /community/replies/:id
   * Delete a reply (only author or admin)
   */
  @Delete('replies/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteReply(@Param('id') id: string, @Req() req: RequestWithUser) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.communityService.deleteReply(id, req.user.id, req.user.role);
  }
}
