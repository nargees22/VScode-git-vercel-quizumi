import { useEffect } from 'react';
import { supabase } from '../service/supabase';
// import quizzes from '../data/firebase-quizzes.json';

const MigrationPage = () => {

  useEffect(() => {
    const migrate = async () => {
      console.log('🚀 Migration started');

      for (const quiz of quizzes as any[]) {
        console.log('Migrating quiz:', quiz.id);

        // 1️⃣ Upsert quiz master - Explicitly conflict on quiz_id
        const { error: quizError } = await supabase
          .from('quiz_master_structure')
          .upsert({
            quiz_id: quiz.id,
            title: quiz.title,
            organizer_name: quiz.organizerName,
            host_id: quiz.hostId ?? null,
            game_state: quiz.gameState ?? 'LOBBY',
            current_question_index: quiz.currentQuestionIndex ?? 0,
            show_live_response_count: quiz.config?.showLiveResponseCount ?? true,
            show_question_to_players: quiz.config?.showQuestionToPlayers ?? true,
            clan_based: quiz.config?.clanBased ?? false,
            titan_name: quiz.config?.clanNames?.Titans ?? null,
            defender_name: quiz.config?.clanNames?.Defenders ?? null,
            clan_assignment: quiz.config?.clanAssignment ?? null,
            is_draft: quiz.isDraft ?? false
          }, { onConflict: 'quiz_id' });

        if (quizError) {
          console.error(`❌ Quiz Master Error (${quiz.id}):`, quizError.message);
          continue;
        }

        // 2️⃣ Insert questions into the `quiz_questions` table
        if (Array.isArray(quiz.questions)) {
          const questionRows = quiz.questions.map((q: any, index: number) => ({
            quiz_id: quiz.id,
            question_order: index + 1, // Add question_order field
            question_text: q.text,
            type: q.type ?? null,
            time_limit: q.timeLimit ?? 30,
            technology: q.technology ?? null,
            skill: q.skill ?? null,
            correct_answer_index: q.correctAnswerIndex ?? null,
            created_at: new Date().toISOString(),
            option_1: q.options?.[0] || null,
            option_2: q.options?.[1] || null,
            option_3: q.options?.[2] || null,
            option_4: q.options?.[3] || null,
            key: q.key || null // Add key field
          }));

          const { error: questionError } = await supabase
            .from('quiz_questions') // Update table name
            .upsert(questionRows, { onConflict: 'pk_id' });

          if (questionError) {
            console.error('❌ Question insert failed', questionError.message);
          }
        }

        // 3️⃣ Insert players with avatar support
        if (Array.isArray(quiz.players)) {
            const playerRows = quiz.players.map((p: any) => ({
                quiz_id: quiz.id,
                player_id: p.id,
                player_name: p.name,
                avatar: p.avatar || null,
                clan: p.clan || null,
                score: p.score || 0,
                joined_at: new Date().toISOString() // Add joined_at field
            }));

            const { error: playerError } = await supabase
                .from('quiz_players')
                .upsert(playerRows, { onConflict: 'quiz_id,player_id' });
            
            if (playerError) {
                console.error('❌ Player insert failed', playerError.message);
            }
        }

        // Insert answers into the `quiz_answers` table
        if (Array.isArray(quiz.answers)) {
            const answerRows = quiz.answers.map((a: any) => ({
                quiz_id: quiz.id,
                player_id: a.playerId,
                question_id: a.questionId,
                answer: a.answer ? JSON.stringify(a.answer) : null,
                time_taken: a.timeTaken ?? null,
                score: a.score ?? 0,
                lifeline_used: a.lifelineUsed ?? null,
                created_at: new Date().toISOString()
            }));

            const { error: answerError } = await supabase
                .from('quiz_answers')
                .upsert(answerRows, { onConflict: 'pk_id' });

            if (answerError) {
                console.error('❌ Answer insert failed', answerError.message);
            }
        }
      }

      console.log('✅ Migration completed');
      alert('Migration completed successfully!');
    };

    migrate();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>⚠️ Migration in Progress</h1>
      <p>Check console logs for detailed progress. Do NOT refresh this page.</p>
    </div>
  );
};

export default MigrationPage;
