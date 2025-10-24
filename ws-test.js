const io = require('socket.io-client');

const teacherToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJlbWFpbCI6InRlYWNoZXJAdGVzdC5jb20iLCJyb2xlIjoidGVhY2hlciIsImlhdCI6MTc2MTMxNTk2OSwiZXhwIjoxNzYxOTIwNzY5fQ.7aEeLOBR82QDyK5h4Q-riFzKt5QyWMbKUzV0IcMuFxI';
const channelId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const socket = io('http://localhost:2086', {
  auth: { token: teacherToken }
});

socket.on('connect', () => {
  console.log('✅ WebSocket 연결 성공!');
  console.log('Socket ID:', socket.id);
  
  socket.emit('channel.join', { channelId }, (response) => {
    console.log('✅ 채널 입장:', response);
    
    socket.emit('message.send', {
      channelId,
      text: 'WebSocket 테스트 메시지입니다!'
    }, (response) => {
      console.log('✅ 메시지 전송:', response);
      setTimeout(() => process.exit(0), 1000);
    });
  });
});

socket.on('message.created', (data) => {
  console.log('📨 새 메시지 수신:', data.message.text);
});

socket.on('connect_error', (err) => {
  console.log('❌ 연결 오류:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏱️ 타임아웃');
  process.exit(1);
}, 10000);
