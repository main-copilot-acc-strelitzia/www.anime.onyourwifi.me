-- Add activity tracking and theme selection to User model
ALTER TABLE "User" ADD COLUMN "currentTheme" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "User" ADD COLUMN "lastActivityAt" TIMESTAMP(3);

-- Create index on lastActivityAt for efficient activity queries
CREATE INDEX "User_lastActivityAt_idx" ON "User"("lastActivityAt");

-- Update CommunityPost model to support moderators
ALTER TABLE "CommunityPost" ADD COLUMN "mainModeratorId" TEXT;
ALTER TABLE "CommunityPost" ADD COLUMN "replyCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CommunityPost" ADD COLUMN "lastActivityAt" TIMESTAMP(3);

-- Create moderators join table (many-to-many)
CREATE TABLE "CommunityPostModerators" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("postId", "userId"),
    CONSTRAINT "CommunityPostModerators_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommunityPostModerators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add foreign key for mainModerator
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_mainModeratorId_fkey" FOREIGN KEY ("mainModeratorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index on mainModerator for efficient lookups
CREATE INDEX "CommunityPost_mainModeratorId_idx" ON "CommunityPost"("mainModeratorId");
CREATE INDEX "CommunityPost_lastActivityAt_idx" ON "CommunityPost"("lastActivityAt");
