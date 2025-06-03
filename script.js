// Элементы DOM
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');

// URL вашего webhook n8n (замените на ваш реальный URL)
const N8N_WEBHOOK_URL = 'https://aiauton8n.ru/webhook/89a9d256-5574-4ed4-ad4c-e03f4ed33e2f';

// Функция прокрутки к чату
function scrollToChat() {
    document.getElementById('chat-section').scrollIntoView({
        behavior: 'smooth'
    });
}

// Функция для простой обработки Markdown
function parseMarkdown(text) {
    return text
        // Заголовки
        .replace(/### (.*$)/gim, '<h3>$1</h3>')
        .replace(/## (.*$)/gim, '<h2>$1</h2>')
        .replace(/# (.*$)/gim, '<h1>$1</h1>')
        // Жирный текст
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        // Курсив
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Списки
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        // Переносы строк
        .replace(/\n/gim, '<br>');
}

// Обновленная функция добавления сообщения
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = isUser ? '👤' : '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Обрабатываем Markdown только для сообщений бота
    if (!isUser) {
        messageContent.innerHTML = parseMarkdown(content);
    } else {
        messageContent.innerHTML = content;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Функция показа индикатора печати
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(messageContent);
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Функция удаления индикатора печати
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Функция отправки запроса к n8n
async function sendToN8N(message) {
    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                timestamp: new Date().toISOString(),
                sessionId: getSessionId()
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Проверяем, является ли data массивом
        let responseData;
        if (Array.isArray(data) && data.length > 0) {
            responseData = data[0];
        } else {
            responseData = data;
        }
        
        if (responseData.output) {
            return responseData.output;
        } else {
            return 'Извините, произошла ошибка при обработке вашего запроса.';
        }
        
    } catch (error) {
        return 'Извините, сервис временно недоступен. Попробуйте позже или свяжитесь с нами по телефону.';
    }
}

// Функция получения/создания ID сессии
function getSessionId() {
    let sessionId = localStorage.getItem('chatSessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatSessionId', sessionId);
    }
    return sessionId;
}

// Функция отправки сообщения
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Добавляем сообщение пользователя
    addMessage(message, true);
    chatInput.value = '';
    
    // Показываем индикатор печати
    showTypingIndicator();
    
    // Отправляем сообщение в n8n и получаем ответ
    const botResponse = await sendToN8N(message);
    
    // Убираем индикатор печати
    removeTypingIndicator();
    
    // Добавляем ответ бота
    addMessage(botResponse, false);
}

// Функция отправки предложенного вопроса
function sendSuggestion(text) {
    chatInput.value = text;
    sendMessage();
}

// Обработчики событий
sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Анимация появления элементов при прокрутке
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Применяем анимацию к элементам чата
document.addEventListener('DOMContentLoaded', () => {
    const chatElements = document.querySelectorAll('.chat-header, .chat-container');
    chatElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Добавляем приветственное сообщение
    setTimeout(() => {
        addMessage('Здравствуйте! Я ИИ-консультант по вопросам банкротства. Расскажите о вашей ситуации, и я помогу определить, подходит ли вам процедура списания долгов.', false);
    }, 1000);
});