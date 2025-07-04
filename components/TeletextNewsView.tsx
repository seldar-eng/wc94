
import React, { useState, useEffect } from 'react';

interface TeletextNewsViewProps {
  headlines: string[];
  onContinue: () => void;
}

const TeletextNewsView: React.FC<TeletextNewsViewProps> = ({ headlines, onContinue }) => {
  const [pageNumber, setPageNumber] = useState(101);

  useEffect(() => {
    setPageNumber(100 + Math.floor(Math.random() * 5) + 1); 
  }, []);

  return (
    <div className="panel-cm p-0 bg-cm-blue border-2 border-cm-cyan/50">
      <div className="flex justify-between items-center p-2 bg-black/30 border-b-2 border-cm-cyan/50">
        <span className="text-xl text-cm-yellow">P{pageNumber} WC94 NEWS</span>
        <span className="text-xl text-cm-cyan">{new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</span>
      </div>

      <div className="p-4 space-y-3 min-h-[250px]">
        {headlines.map((headline, index) => (
          <p 
            key={index} 
            className={`text-xl leading-tight ${index % 2 === 0 ? 'text-cm-yellow' : 'text-cm-cyan'}`}
          >
            {`> ${headline}`}
          </p>
        ))}
      </div>
      
      <div className="p-3 mt-3 border-t-2 border-cm-gray-light/50 text-center">
        <button 
          type="button"
          onClick={onContinue} 
          className="btn-pm bg-cm-gray-light text-black hover:bg-cm-cream"
        >
          <i className="fas fa-arrow-right mr-2"></i>CONTINUE TO NEXT SCREEN
        </button>
      </div>
    </div>
  );
};

export default TeletextNewsView;