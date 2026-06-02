import { ChevronLeft } from 'lucide-react';
import VocabularyBlock from './VocabularyBlock';
import ExampleSentences from './ExampleSentences';
import PracticeSection from './PracticeSection';

export default function LessonPage({ user, lesson, onSubmitAnswer, onSaveSession, stats, onBack }) {
  return (
    <div className="lesson-page">
      <section className="lesson-hero">
        <div>
          {onBack && (
            <button className="back-btn" type="button" onClick={onBack}>
              <ChevronLeft size={16} /> レッスン一覧
            </button>
          )}
          <p className="eyebrow">{lesson.topicArea}</p>
          <h2>{lesson.lessonTitle}</h2>
          <p>{user.name}, study the words and sentences. Then complete the practice.</p>
        </div>
        <div className="score-panel">
          <span>Current score</span>
          <strong>{stats.score}%</strong>
          <small>{stats.completed} attempts saved</small>
        </div>
      </section>

      {/* C. Vocabulary */}
      <VocabularyBlock vocabulary={lesson.vocabulary} />

      {/* D. Example Sentences */}
      <ExampleSentences sentences={lesson.exampleSentences} />

      {/* E. Practice */}
      <PracticeSection
        lesson={lesson}
        onSubmitAnswer={onSubmitAnswer}
        onSaveSession={onSaveSession}
      />
    </div>
  );
}
