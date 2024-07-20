import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DataLoaderService } from 'src/data-loader/data-loader.service';
import { FilterProps } from 'src/data-loader/data-loader.types';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { comments, tagRelationships } from 'src/schema';

import { Comment } from './types';

@Injectable()
export class CommentsService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly dataLoaderService: DataLoaderService,
  ) {}

  async loadCommentById(id: bigint) {
    const dataLoader = this.dataLoaderService.getDataLoader<
      FilterProps,
      bigint,
      Comment
    >({ __key: 'loadCommentById' }, async (keys) => {
      const result = await this.drizzleService.db
        .select()
        .from(comments)
        .where(inArray(comments.id, [...keys]))
        .execute();

      const mapResult = result.reduce((map, result) => {
        map.set(result.id, result as Comment);
        return map;
      }, new Map<bigint, Comment>());

      return keys.map((key) => mapResult.get(key));
    });

    return dataLoader.load(id);
  }

  async loadCommentsByTagId(tagId: bigint) {
    const dataLoader = this.dataLoaderService.getDataLoader<
      FilterProps,
      bigint,
      Array<Comment>
    >({ __key: 'loadCommentsByTagId' }, async (keys) => {
      const result = await this.drizzleService.db
        .select({
          id: comments.id,
          postId: comments.postId,
          parentId: comments.parentId,
          content: comments.content,
          createdBy: comments.createdBy,
          createdAt: comments.createdAt,
          updatedBy: comments.updatedBy,
          updatedAt: comments.updatedAt,
          tagId: tagRelationships.tagId,
        })
        .from(comments)
        .leftJoin(
          tagRelationships,
          and(
            eq(tagRelationships.entityName, 'comment'),
            eq(tagRelationships.entityId, comments.id),
          ),
        )
        .where(inArray(tagRelationships.tagId, [...keys]))
        .execute();

      return keys.map(
        (key) =>
          result.filter(
            (comment) => comment.tagId === key,
          ) as unknown as Array<Comment>,
      );
    });

    return dataLoader.load(tagId);
  }

  async loadCommentsByPostId(postId: bigint) {
    const dataLoader = this.dataLoaderService.getDataLoader<
      FilterProps,
      bigint,
      Array<Comment>
    >({ __key: 'loadCommentsByPostId' }, async (keys) => {
      const result = await this.drizzleService.db
        .select()
        .from(comments)
        .execute();

      return keys.map(
        (key) =>
          result.filter(
            (comment) => comment.postId === key,
          ) as unknown as Array<Comment>,
      );
    });

    return dataLoader.load(postId);
  }
}
