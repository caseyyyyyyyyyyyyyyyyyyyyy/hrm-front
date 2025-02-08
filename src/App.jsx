import { useState } from 'react'
import './App.css'
import wumMainImg from './assets/wum-main.ce0d35ca002a747009ce7a2c1ecec06d.svg'

const ChatPage = ({ menuItem, onClose, onSubmit, chatQuery, setChatQuery, chatHistory }) => {
  const handleInputChange = (e) => {
    setChatQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e?.preventDefault(); // 이벤트 전파 중지
    if (chatQuery.trim()) {
      onSubmit(chatQuery);
      setChatQuery('');
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-button" onClick={onClose}>←</button>
        <h1>HRM AI</h1>
      </div>
      
      <div className="chat-title">
        {menuItem.originName}
      </div>

      <div className="chat-container">
        {chatHistory.map((message, index) => (
          <div key={index} className={`chat-message ${message.isUser ? 'user' : 'ai'}`}>
            <p>{message.text}</p>
          </div>
        ))}
      </div>

      <div className="chat-input-wrapper">
        <form onSubmit={handleSubmit} className="chat-input-container">
          <input 
            type="text" 
            className="chat-input"
            placeholder="메시지를 입력하세요..."
            value={chatQuery}
            onChange={handleInputChange}
          />
          <button 
            type="submit"
            className="send-button"
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [menuData, setMenuData] = useState(null)
  const [activeTab, setActiveTab] = useState('식당 요약')
  const [selectedMenuItem, setSelectedMenuItem] = useState(null)
  const [chatQuery, setChatQuery] = useState('')
  const [isChatting, setIsChatting] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [chatHistory, setChatHistory] = useState([])

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(URL.createObjectURL(file))
      setLoading(true)
      setMenuData(null)
      
      try {
        const formData = new FormData()
        formData.append('file', file)

        const newSessionId = crypto.randomUUID()
        setSessionId(newSessionId)
        console.log('요청 시작:', newSessionId)

        const response = await fetch(`https://wum-api.hojun.link/v1/menu/${newSessionId}`, {
          method: 'POST',
          body: formData,
          mode: 'cors'
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error('서버 에러:', errorData)
          throw new Error(`이미지 전송 실패 (${response.status})`)
        }

        const data = await response.json()
        console.log('API Response:', data)  // 데이터 구조 확인
        setMenuData(data)
        
      } catch (error) {
        console.error('에러 상세:', error)
        alert('메뉴 분석에 실패했습니다. 다시 시도해주세요.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleChatStart = () => {
    setIsChatting(true);
  };

  const handleChatSubmit = async (menuItem, customQuery = '') => {
    try {
      setChatHistory(prev => [...prev, { text: customQuery, isUser: true }]);
      
      const response = await fetch(`https://wum-api.hojun.link/v1/chat/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${customQuery} (메뉴: ${menuItem.originName}, 가격: ${menuItem.price}원, 설명: ${menuItem.shortDescription})`,
          context: `당신은 ${menuItem.originName}에 대해 잘 아는 전문가입니다. 다른 메뉴에 대해 물어보면 "${menuItem.originName}에 대해서만 상담해드릴 수 있습니다"라고 답변하세요. 메뉴의 맛, 특징, 조리법, 추천 조합 등에 대해 자세히 답변해주세요.`
        })
      });

      if (!response.ok) {
        throw new Error(`채팅 요청 실패 (${response.status})`);
      }

      const data = await response.json();
      console.log('API Response:', data);  // 데이터 구조 확인
      setChatHistory(prev => [...prev, { text: data.response, isUser: false }]);

    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { 
        text: '죄송합니다. 응답을 받지 못했습니다. 다시 시도해주세요.', 
        isUser: false 
      }]);
    }
  };

  const handleCloseChat = () => {
    setSelectedMenuItem(null)
    setChatHistory([])
  }

  const handleMenuItemClick = (item) => {
    console.log('Selected menu item:', item)
    console.log('originName:', item.originName)
    console.log('shortDescription:', item.shortDescription)
    console.log('price:', item.price)
    setSelectedMenuItem(item)
  }

  // 구글 이미지 검색 함수 추가
  const handleGoogleImageSearch = (menuName) => {
    const searchQuery = encodeURIComponent(menuName);
    const googleImageUrl = `https://www.google.com/search?q=${searchQuery}&tbm=isch`;
    window.open(googleImageUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>분석 중...</h2>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // 채팅 페이지가 활성화되었을 때
  if (isChatting && selectedMenuItem) {
    return (
      <ChatPage 
        menuItem={selectedMenuItem}
        onClose={() => {
          setIsChatting(false);
          setChatQuery('');
          setChatHistory([]);
        }}
        onSubmit={(query) => handleChatSubmit(selectedMenuItem, query)}
        chatQuery={chatQuery}
        setChatQuery={setChatQuery}
        chatHistory={chatHistory}
      />
    );
  }

  if (menuData) {
    return (
      <div className="result-page">
        <div className="tab-container">
          <button 
            className={`tab-button ${activeTab === '식당 요약' ? 'active' : ''}`}
            onClick={() => setActiveTab('식당 요약')}
          >
            식당 요약
          </button>
          <button 
            className={`tab-button ${activeTab === '메뉴' ? 'active' : ''}`}
            onClick={() => setActiveTab('메뉴')}
          >
            메뉴
          </button>
        </div>

        {activeTab === '식당 요약' && (
          <div className="summary-content">
            {menuData.description.map((section, index) => (
              <div key={index} className="summary-section">
                <h2>{section.sectionName}</h2>
                <p>{section.text}</p>
              </div>
            ))}
          </div>
        )}

        {selectedMenuItem && (
          <div className="chat-modal">
            <div className="chat-content">
              <button className="close-button" onClick={handleCloseChat}>×</button>
              <h3>{selectedMenuItem.originName}가 어떤 메뉴인지 알아볼까요?</h3>
              <div className="chat-actions">
                <button 
                  className="chat-action-button black"
                  onClick={() => handleChatStart()}
                >
                  실시간 AI 채팅을 통해 더 알아보기
                </button>
                <button 
                  className="chat-action-button white"
                  onClick={() => handleGoogleImageSearch(selectedMenuItem.originName)}
                >
                  구글 이미지 검색에서 더 알아보기
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === '메뉴' && (
          <div className="menu-content">
            {menuData.menu.map((section, sectionIndex) => (
              <div key={sectionIndex} className="menu-section">
                <h2>{section.sectionName}</h2>
                <div className="menu-items">
                  {section.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex} 
                      className="menu-item"
                      onClick={() => handleMenuItemClick(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="menu-item-main">
                        <div className="menu-item-header">
                          <div className="menu-name">
                            <div className="menu-title">
                              {item.originName} <span className="spanish-name">({item.pronunciation})</span>
                            </div>
                            <span className="price">{item.price.toLocaleString()}원</span>
                            <button 
                              className="more-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuItemClick(item);
                              }}
                            >
                              ⋮
                            </button>
                          </div>
                        </div>
                        <p className="description">{item.shortDescription}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <h1>메뉴판에 적힌 음식,<br />뭔지 모르겠다면?</h1>
      
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          id="imageInput"
          style={{ display: 'none' }}
        />
        <label htmlFor="imageInput" className="upload-button">
          시작하기
        </label>
      </div>

      {!menuData && (
        <div className="floating-image">
          <img src={wumMainImg} alt="음식 일러스트" className="floating-food" />
        </div>
      )}
    </div>
  )
}

export default App
