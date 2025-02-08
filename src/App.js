import React from 'react';
import './App.css';

function App() {
  const handleImageUpload = () => {
    // 이미지 업로드 기능은 추후 구현
    console.log('이미지 업로드 버튼이 눌렸습니다');
  };

  return (
    <div className="container">
      <h1 className="title">메뉴판 번역 서비스!</h1>
      <button 
        className="upload-button"
        onClick={handleImageUpload}
      >
        사진 업로드하기
      </button>
    </div>
  );
}

export default App; 