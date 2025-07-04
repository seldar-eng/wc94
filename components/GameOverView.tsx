
import React from 'react';

interface GameOverViewProps {
  title: string;
  message: string;
  onPlayAgain: () => void; 
  onMainMenu: () => void; 
}

const GameOverView: React.FC<GameOverViewProps> = ({ 
    title, 
    message, 
    onPlayAgain, 
    onMainMenu,
}) => {
  return (
    <div className="panel-cm text-center">
      <h2 className="text-2xl mb-3 text-cm-yellow border-b-2 border-cm-gray-light pb-1">{title}</h2>
      <p className="text-lg text-cm-cream mb-4 whitespace-pre-line">{message}</p>

       <div className="my-4 p-2 border-2 border-dashed border-cm-gray-light/50 bg-black/20">
        <h3 className="text-lg text-cm-cyan">HISTORICAL RESULTS</h3>
        <p className="text-base text-cm-cream/80">The final game at the Rose Bowl was tense but devoid of scoring chances. It was the second time in 24 years that the two nations had met in a final. After 120 goalless minutes, the World Cup was decided for the first time by a penalty shootout. After four rounds, Brazil led 3–2, and Baggio, playing injured, had to score to keep Italy's hopes alive. He missed by shooting it over the crossbar, and the Brazilians were crowned champions for the fourth time. The third-place play-off was set between Bulgaria and Sweden, the team which scored more goals than any other in this World Cup with 15 over seven matches. These teams had also previously met in the qualifying group. Sweden won, 4–0. Swedish forward Tomas Brolin was named to the All-star team.</p>
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-2">
        <button type="button" onClick={onPlayAgain} className="btn-pm">
          <i className="fas fa-sync-alt"></i>PLAY AGAIN (SAME TEAM)
        </button>
        <button type="button" onClick={onMainMenu} className="btn-pm">
          <i className="fas fa-home"></i>MAIN MENU
        </button>
      </div>
    </div>
  );
};

export default GameOverView;