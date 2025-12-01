import { gradeWithStoredQuestions } from './gradingService';
import { prisma } from '../lib/prisma';

interface PageGradingResult {
    pageNumber: number;
    imageUrl: string;
    annotations: any[];
    imageDimensions?: { width: number; height: number };
    answers: any[];
}

interface MultiPageGradingResult {
    gradingId: string;
    pages: PageGradingResult[];
    overallFeedback: string;
    totalScore: string;
    subject: string;
    language: string;
    gradeLevel: string;
}

/**
 * Grade multiple answer sheet pages
 */
export async function gradeMultiplePages(
    questionPaperId: string,
    answerSheetPaths: string[],
    userId?: string
): Promise<MultiPageGradingResult> {
    const pageResults: PageGradingResult[] = [];
    let allAnswers: any[] = [];
    let totalCorrect = 0;
    let totalQuestions = 0;
    let subject = '';
    let language = '';
    let gradeLevel = '';

    console.log(`📚 Grading ${answerSheetPaths.length} pages...`);

    // Process each page
    for (let i = 0; i < answerSheetPaths.length; i++) {
        const pagePath = answerSheetPaths[i];
        console.log(`📄 Processing page ${i + 1}/${answerSheetPaths.length}...`);

        try {
            // Grade this page
            const result = await gradeWithStoredQuestions(pagePath, questionPaperId, userId);

            // Store page result
            pageResults.push({
                pageNumber: i + 1,
                imageUrl: pagePath,
                annotations: result.annotations || [],
                imageDimensions: result.imageDimensions,
                answers: result.detailedAnalysis
            });

            // Accumulate results
            allAnswers = [...allAnswers, ...result.detailedAnalysis];
            totalQuestions += result.detailedAnalysis.length;
            totalCorrect += result.detailedAnalysis.filter((a: any) => a.correct).length;

            // Get metadata from first page
            if (i === 0) {
                subject = result.subject;
                language = result.language;
                gradeLevel = result.gradeLevel;
            }
        } catch (error) {
            console.error(`❌ Error grading page ${i + 1}:`, error);
            throw new Error(`Failed to grade page ${i + 1}: ${error.message}`);
        }
    }

    // Generate overall feedback
    const overallFeedback = generateOverallFeedback(totalCorrect, totalQuestions, subject);
    const totalScore = `${totalCorrect}/${totalQuestions}`;

    console.log(`✅ Grading complete: ${totalScore}`);

    // Store in database
    const gradingId = await storeMultiPageGrading({
        userId,
        questionPaperId,
        pages: pageResults,
        overallFeedback,
        totalScore,
        subject,
        language,
        gradeLevel,
        totalPages: answerSheetPaths.length,
        totalQuestions,
        answeredQuestions: totalQuestions
    });

    return {
        gradingId,
        pages: pageResults,
        overallFeedback,
        totalScore,
        subject,
        language,
        gradeLevel
    };
}

/**
 * Generate overall feedback across all pages
 */
function generateOverallFeedback(correct: number, total: number, subject: string): string {
    const percentage = (correct / total) * 100;

    if (percentage >= 90) {
        return `🎯 Arre wah! Outstanding performance! You scored ${correct}/${total}! ${subject} mein tumhari pakad bahut strong hai! Keep it up! 🌟`;
    } else if (percentage >= 75) {
        return `✨ Bahut badhiya! You got ${correct}/${total}! Excellent work across all pages! Thodi si practice aur perfect ho jayega! 💪`;
    } else if (percentage >= 60) {
        return `💪 Good effort! You scored ${correct}/${total}. Kuch concepts mein improvement ki zaroorat hai. Let's work on them together! 📚`;
    } else if (percentage >= 40) {
        return `📚 You got ${correct}/${total}. Chalo, let's strengthen your basics. Regular practice se improvement hoga. Don't worry, you've got this! 🚀`;
    } else {
        return `🎯 You scored ${correct}/${total}. Concepts ko revise karo aur practice karo. I'm here to help you improve! Let's work together! 💡`;
    }
}

/**
 * Store multi-page grading in database
 */
async function storeMultiPageGrading(data: {
    userId?: string;
    questionPaperId: string;
    pages: PageGradingResult[];
    overallFeedback: string;
    totalScore: string;
    subject: string;
    language: string;
    gradeLevel: string;
    totalPages: number;
    totalQuestions: number;
    answeredQuestions: number;
}): Promise<string> {
    const grading = await prisma.grading.create({
        data: {
            userId: data.userId,
            questionPaperId: data.questionPaperId,
            answerSheetUrl: data.pages[0].imageUrl, // First page as primary
            totalPages: data.totalPages,
            subject: data.subject,
            language: data.language,
            gradeLevel: data.gradeLevel,
            totalScore: data.totalScore,
            feedback: data.overallFeedback,
            matchingMode: 'dual',
            totalQuestions: data.totalQuestions,
            answeredQuestions: data.answeredQuestions,
            pages: {
                create: data.pages.map(page => ({
                    pageNumber: page.pageNumber,
                    imageUrl: page.imageUrl,
                    annotations: JSON.stringify(page.annotations),
                    imageDimensions: page.imageDimensions ? JSON.stringify(page.imageDimensions) : null,
                    pageAnswers: {
                        create: page.answers.map((answer: any) => ({
                            questionNumber: answer.questionNumber,
                            studentAnswer: answer.studentAnswer,
                            correct: answer.correct,
                            score: answer.score,
                            remarks: answer.remarks,
                            matched: answer.matched !== false,
                            matchConfidence: answer.matchConfidence || 1.0,
                            positionX: answer.position?.x,
                            positionY: answer.position?.y
                        }))
                    }
                }))
            }
        }
    });

    return grading.id;
}

/**
 * Get multi-page grading by ID
 */
export async function getMultiPageGrading(gradingId: string) {
    const grading = await prisma.grading.findUnique({
        where: { id: gradingId },
        include: {
            pages: {
                include: {
                    pageAnswers: true
                },
                orderBy: {
                    pageNumber: 'asc'
                }
            },
            questionPaper: true
        }
    });

    if (!grading) {
        return null;
    }

    // Transform to frontend format
    return {
        id: grading.id,
        subject: grading.subject,
        language: grading.language,
        gradeLevel: grading.gradeLevel,
        totalScore: grading.totalScore,
        overallFeedback: grading.feedback,
        totalPages: grading.totalPages,
        pages: grading.pages.map(page => ({
            pageNumber: page.pageNumber,
            imageUrl: page.imageUrl,
            annotations: page.annotations ? JSON.parse(page.annotations) : [],
            imageDimensions: page.imageDimensions ? JSON.parse(page.imageDimensions) : null,
            detailedAnalysis: page.pageAnswers.map(answer => ({
                id: answer.id,
                questionNumber: answer.questionNumber,
                question: '', // Would need to join with QuestionPaper
                studentAnswer: answer.studentAnswer,
                correct: answer.correct,
                score: answer.score,
                remarks: answer.remarks,
                position: answer.positionX && answer.positionY ? {
                    x: answer.positionX,
                    y: answer.positionY
                } : undefined
            }))
        })),
        createdAt: grading.createdAt
    };
}
