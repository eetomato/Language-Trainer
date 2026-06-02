import { ChevronLeft } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import GrammarBox from './GrammarBox';
import VocabularyBlock from './VocabularyBlock';
import ExampleSentences from './ExampleSentences';
import PracticeSection from './PracticeSection';

export default function LessonPage({ user, lesson, onSubmitAnswer, stats, onBack }) {
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
          <p>{user.name}, start with structure. Then use the phrase in a customer-facing sentence.</p>
        </div>
        <div className="score-panel">
          <span>Current score</span>
          <strong>{stats.score}%</strong>
          <small>{stats.completed} attempts saved</small>
        </div>
      </section>

      <YouTubeEmbed url={lesson.youtubeUrl} />
      <GrammarBox grammarPoint={lesson.grammarPoint} />
      <VocabularyBlock vocabulary={lesson.vocabulary} />
      <ExampleSentences sentences={lesson.exampleSentences} />
      <PracticeSection lesson={lesson} onSubmitAnswer={onSubmitAnswer} />
    </div>
  );
}
