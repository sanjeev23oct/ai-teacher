// ===========================
// Social Notes Service
// Handles social features for Smart Notes (Phase 1)
// ===========================

import prisma from '../lib/prisma';

// ===========================
// FRIEND SYSTEM
// ===========================

/**
 * Send friend request
 */
export async function sendFriendRequest(userId: string, friendEmail: string) {
  // Find friend by email
  const friend = await prisma.user.findUnique({
    where: { email: friendEmail },
    select: { id: true, name: true, email: true, grade: true, school: true }
  });

  if (!friend) {
    throw new Error('User not found with this email');
  }

  if (friend.id === userId) {
    throw new Error('Cannot send friend request to yourself');
  }

  // Check if connection already exists
  const existing = await prisma.userConnection.findUnique({
    where: {
      userId_friendId: { userId, friendId: friend.id }
    }
  });

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('Already friends');
    } else if (existing.status === 'pending') {
      throw new Error('Friend request already sent');
    }
  }

  // Create friend request
  const connection = await prisma.userConnection.create({
    data: {
      userId,
      friendId: friend.id,
      status: 'pending'
    }
  });

  return { connection, friend };
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(userId: string, connectionId: string) {
  const connection = await prisma.userConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection) {
    throw new Error('Friend request not found');
  }

  if (connection.friendId !== userId) {
    throw new Error('Not authorized to accept this request');
  }

  if (connection.status !== 'pending') {
    throw new Error('Request is not pending');
  }

  // Update to accepted
  return await prisma.userConnection.update({
    where: { id: connectionId },
    data: { status: 'accepted' }
  });
}

/**
 * Reject friend request
 */
export async function rejectFriendRequest(userId: string, connectionId: string) {
  const connection = await prisma.userConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection) {
    throw new Error('Friend request not found');
  }

  if (connection.friendId !== userId) {
    throw new Error('Not authorized to reject this request');
  }

  // Delete the connection
  return await prisma.userConnection.delete({
    where: { id: connectionId }
  });
}

/**
 * Remove friend
 */
export async function removeFriend(userId: string, friendId: string) {
  // Find connection in either direction
  const connection = await prisma.userConnection.findFirst({
    where: {
      OR: [
        { userId, friendId, status: 'accepted' },
        { userId: friendId, friendId: userId, status: 'accepted' }
      ]
    }
  });

  if (!connection) {
    throw new Error('Friendship not found');
  }

  // Delete the connection
  return await prisma.userConnection.delete({
    where: { id: connection.id }
  });
}

/**
 * Get user's friends list
 */
export async function getFriendsList(userId: string) {
  const connections = await prisma.userConnection.findMany({
    where: {
      OR: [
        { userId, status: 'accepted' },
        { friendId: userId, status: 'accepted' }
      ]
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, grade: true, school: true }
      },
      friend: {
        select: { id: true, name: true, email: true, grade: true, school: true }
      }
    }
  });

  // Map to friend objects (exclude current user)
  return connections.map(conn => {
    return conn.userId === userId ? conn.friend : conn.user;
  });
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingRequests(userId: string) {
  const requests = await prisma.userConnection.findMany({
    where: {
      friendId: userId,
      status: 'pending'
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, grade: true, school: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return requests.map(req => ({
    id: req.id,
    from: req.user,
    createdAt: req.createdAt
  }));
}

// ===========================
// LIKE SYSTEM
// ===========================

/**
 * Like a note
 */
export async function likeNote(userId: string, noteId: string) {
  // Check if already liked
  const existing = await prisma.noteLike.findUnique({
    where: {
      userId_noteId: { userId, noteId }
    }
  });

  if (existing) {
    throw new Error('Already liked this note');
  }

  // Create like and increment count
  const [like] = await prisma.$transaction([
    prisma.noteLike.create({
      data: { userId, noteId }
    }),
    prisma.smartNote.update({
      where: { id: noteId },
      data: { likeCount: { increment: 1 } }
    })
  ]);

  return like;
}

/**
 * Unlike a note
 */
export async function unlikeNote(userId: string, noteId: string) {
  const existing = await prisma.noteLike.findUnique({
    where: {
      userId_noteId: { userId, noteId }
    }
  });

  if (!existing) {
    throw new Error('Note not liked');
  }

  // Delete like and decrement count
  await prisma.$transaction([
    prisma.noteLike.delete({
      where: { id: existing.id }
    }),
    prisma.smartNote.update({
      where: { id: noteId },
      data: { likeCount: { decrement: 1 } }
    })
  ]);

  return { success: true };
}

// ===========================
// BOOKMARK SYSTEM
// ===========================

/**
 * Bookmark a note
 */
export async function bookmarkNote(userId: string, noteId: string, collection?: string) {
  // Check if already bookmarked
  const existing = await prisma.noteBookmark.findUnique({
    where: {
      userId_noteId: { userId, noteId }
    }
  });

  if (existing) {
    // Update collection if provided
    if (collection) {
      return await prisma.noteBookmark.update({
        where: { id: existing.id },
        data: { collection }
      });
    }
    throw new Error('Already bookmarked');
  }

  // Create bookmark and increment count
  const [bookmark] = await prisma.$transaction([
    prisma.noteBookmark.create({
      data: { userId, noteId, collection }
    }),
    prisma.smartNote.update({
      where: { id: noteId },
      data: { bookmarkCount: { increment: 1 } }
    })
  ]);

  return bookmark;
}

/**
 * Remove bookmark
 */
export async function removeBookmark(userId: string, noteId: string) {
  const existing = await prisma.noteBookmark.findUnique({
    where: {
      userId_noteId: { userId, noteId }
    }
  });

  if (!existing) {
    throw new Error('Note not bookmarked');
  }

  // Delete bookmark and decrement count
  await prisma.$transaction([
    prisma.noteBookmark.delete({
      where: { id: existing.id }
    }),
    prisma.smartNote.update({
      where: { id: noteId },
      data: { bookmarkCount: { decrement: 1 } }
    })
  ]);

  return { success: true };
}

/**
 * Get user's bookmarked notes
 */
export async function getBookmarkedNotes(userId: string, collection?: string) {
  const where: any = { userId };
  if (collection) {
    where.collection = collection;
  }

  const bookmarks = await prisma.noteBookmark.findMany({
    where,
    include: {
      note: {
        include: {
          user: {
            select: { id: true, name: true, grade: true, school: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return bookmarks.map(b => ({
    ...b.note,
    bookmarkedAt: b.createdAt,
    collection: b.collection
  }));
}

// ===========================
// COMMUNITY FEED
// ===========================

/**
 * Get community notes with filters
 */
export async function getCommunityNotes(
  userId: string,
  filters: {
    visibility?: string;
    class?: string;
    subject?: string;
    school?: string;
    sortBy?: 'recent' | 'popular' | 'trending';
    limit?: number;
    offset?: number;
  }
) {
  const { visibility, class: className, subject, school, sortBy = 'recent', limit = 20, offset = 0 } = filters;

  // Build where clause
  const where: any = {
    visibility: {
      in: ['public', 'class', 'friends']
    }
  };

  if (visibility === 'class' && className) {
    where.class = className;
    where.visibility = 'class';
  } else if (visibility === 'friends') {
    // Get friend IDs
    const friends = await getFriendsList(userId);
    const friendIds = friends.map(f => f.id);
    where.userId = { in: [...friendIds, userId] };
    where.visibility = { in: ['friends', 'public'] };
  } else if (visibility === 'public') {
    where.visibility = 'public';
  }

  if (subject) where.subject = subject;
  if (school) where.school = school;

  // Build order by
  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'popular') {
    orderBy = { likeCount: 'desc' };
  } else if (sortBy === 'trending') {
    // Trending: high likes in recent time
    orderBy = [{ likeCount: 'desc' }, { createdAt: 'desc' }];
  }

  const notes = await prisma.smartNote.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, grade: true, school: true }
      },
      _count: {
        select: { likes: true, bookmarks: true }
      }
    },
    orderBy,
    take: limit,
    skip: offset
  });

  // Add user's interaction status
  const notesWithInteraction = await Promise.all(notes.map(async (note) => {
    const [isLiked, isBookmarked] = await Promise.all([
      prisma.noteLike.findUnique({
        where: { userId_noteId: { userId, noteId: note.id } }
      }),
      prisma.noteBookmark.findUnique({
        where: { userId_noteId: { userId, noteId: note.id } }
      })
    ]);

    return {
      ...note,
      isLiked: !!isLiked,
      isBookmarked: !!isBookmarked
    };
  }));

  return notesWithInteraction;
}

export default {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendsList,
  getPendingRequests,
  likeNote,
  unlikeNote,
  bookmarkNote,
  removeBookmark,
  getBookmarkedNotes,
  getCommunityNotes
};
