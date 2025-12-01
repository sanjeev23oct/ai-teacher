import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RevisionFilters {
  subject?: string;
  search?: string;
}

export class RevisionService {
  /**
   * Add doubt to revision
   */
  async addToRevision(userId: string, doubtId: string): Promise<void> {
    // Check if doubt exists and belongs to user
    const doubt = await prisma.doubt.findFirst({
      where: {
        id: doubtId,
        userId,
      },
    });

    if (!doubt) {
      throw new Error('Doubt not found');
    }

    // Update doubt to mark as in revision
    await prisma.doubt.update({
      where: { id: doubtId },
      data: {
        isInRevision: true,
        addedToRevisionAt: new Date(),
      },
    });
  }

  /**
   * Remove doubt from revision
   */
  async removeFromRevision(userId: string, doubtId: string): Promise<void> {
    // Check if doubt exists and belongs to user
    const doubt = await prisma.doubt.findFirst({
      where: {
        id: doubtId,
        userId,
      },
    });

    if (!doubt) {
      throw new Error('Doubt not found');
    }

    // Update doubt to remove from revision
    await prisma.doubt.update({
      where: { id: doubtId },
      data: {
        isInRevision: false,
        addedToRevisionAt: null,
      },
    });
  }

  /**
   * Toggle revision status
   */
  async toggleRevision(userId: string, doubtId: string): Promise<boolean> {
    const doubt = await prisma.doubt.findFirst({
      where: {
        id: doubtId,
        userId,
      },
    });

    if (!doubt) {
      throw new Error('Doubt not found');
    }

    const newStatus = !doubt.isInRevision;

    await prisma.doubt.update({
      where: { id: doubtId },
      data: {
        isInRevision: newStatus,
        addedToRevisionAt: newStatus ? new Date() : null,
      },
    });

    return newStatus;
  }

  /**
   * Check if doubt is in revision
   */
  async isInRevision(userId: string, doubtId: string): Promise<boolean> {
    const doubt = await prisma.doubt.findFirst({
      where: {
        id: doubtId,
        userId,
      },
      select: {
        isInRevision: true,
      },
    });

    return doubt?.isInRevision || false;
  }

  /**
   * Get revision count for user
   */
  async getRevisionCount(userId: string): Promise<number> {
    return await prisma.doubt.count({
      where: {
        userId,
        isInRevision: true,
      },
    });
  }

  /**
   * Get all revision doubts for user
   */
  async getRevisionDoubts(userId: string, filters?: RevisionFilters) {
    const where: any = {
      userId,
      isInRevision: true,
    };

    // Apply subject filter
    if (filters?.subject) {
      where.subject = filters.subject;
    }

    // Apply search filter
    if (filters?.search) {
      where.OR = [
        { questionText: { contains: filters.search, mode: 'insensitive' } },
        { explanation: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const doubts = await prisma.doubt.findMany({
      where,
      orderBy: [
        { addedToRevisionAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        rating: true,
      },
    });

    return doubts.map((doubt) => ({
      id: doubt.id,
      questionText: doubt.questionText,
      subject: doubt.subject,
      language: doubt.language,
      questionImage: doubt.questionImage,
      explanation: JSON.parse(doubt.explanation),
      annotations: doubt.annotations ? JSON.parse(doubt.annotations) : null,
      imageDimensions: doubt.imageDimensions ? JSON.parse(doubt.imageDimensions) : null,
      conversationId: doubt.conversationId,
      messageCount: doubt.messageCount,
      isFavorite: doubt.isFavorite,
      isInRevision: doubt.isInRevision,
      addedToRevisionAt: doubt.addedToRevisionAt,
      rating: doubt.rating?.rating,
      createdAt: doubt.createdAt,
      updatedAt: doubt.updatedAt,
    }));
  }

  /**
   * Get revision doubts grouped by subject
   */
  async getRevisionDoubtsBySubject(userId: string) {
    const doubts = await this.getRevisionDoubts(userId);

    // Group by subject
    const grouped = doubts.reduce((acc, doubt) => {
      const subject = doubt.subject;
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(doubt);
      return acc;
    }, {} as Record<string, typeof doubts>);

    return grouped;
  }

  /**
   * Get available subjects in revision
   */
  async getRevisionSubjects(userId: string): Promise<string[]> {
    const doubts = await prisma.doubt.findMany({
      where: {
        userId,
        isInRevision: true,
      },
      select: {
        subject: true,
      },
      distinct: ['subject'],
    });

    return doubts.map((d) => d.subject);
  }

  /**
   * Bulk add doubts to revision
   */
  async bulkAddToRevision(userId: string, doubtIds: string[]): Promise<number> {
    // Verify all doubts belong to user
    const doubts = await prisma.doubt.findMany({
      where: {
        id: { in: doubtIds },
        userId,
      },
    });

    if (doubts.length !== doubtIds.length) {
      throw new Error('Some doubts not found or do not belong to user');
    }

    // Update all doubts
    const result = await prisma.doubt.updateMany({
      where: {
        id: { in: doubtIds },
        userId,
      },
      data: {
        isInRevision: true,
        addedToRevisionAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Bulk remove doubts from revision
   */
  async bulkRemoveFromRevision(userId: string, doubtIds: string[]): Promise<number> {
    const result = await prisma.doubt.updateMany({
      where: {
        id: { in: doubtIds },
        userId,
      },
      data: {
        isInRevision: false,
        addedToRevisionAt: null,
      },
    });

    return result.count;
  }
}

export const revisionService = new RevisionService();
