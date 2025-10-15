import { connect } from 'cloudflare:sockets';

// 身份标识
let agentId = 'f8909296-7af4-4aac-abda-d43ed79a303a';
let serverHost = 'ips.glitchweishao.dpdns.org';


// 连接状态常量
const CONNECTION_ESTABLISHED = 1;
const CONNECTION_TERMINATING = 2;

// 全球主要城市时区
const WORLD_CITIES = [
  // 亚洲
  { name: "北京", timezone: "Asia/Shanghai", flag: "🇨🇳" },
  { name: "东京", timezone: "Asia/Tokyo", flag: "🇯🇵" },
  { name: "首尔", timezone: "Asia/Seoul", flag: "🇰🇷" },
  { name: "新德里", timezone: "Asia/Kolkata", flag: "🇮🇳" },
  { name: "迪拜", timezone: "Asia/Dubai", flag: "🇦🇪" },
  { name: "新加坡", timezone: "Asia/Singapore", flag: "🇸🇬" },
  { name: "曼谷", timezone: "Asia/Bangkok", flag: "🇹🇭" },
  { name: "吉隆坡", timezone: "Asia/Kuala_Lumpur", flag: "🇲🇾" },
  { name: "伊斯坦布尔", timezone: "Europe/Istanbul", flag: "🇹🇷" },
  { name: "德黑兰", timezone: "Asia/Tehran", flag: "🇮🇷" },
  
  // 欧洲
  { name: "伦敦", timezone: "Europe/London", flag: "🇬🇧" },
  { name: "莫斯科", timezone: "Europe/Moscow", flag: "🇷🇺" },
  { name: "巴黎", timezone: "Europe/Paris", flag: "🇫🇷" },
  { name: "柏林", timezone: "Europe/Berlin", flag: "🇩🇪" },
  { name: "罗马", timezone: "Europe/Rome", flag: "🇮🇹" },
  { name: "马德里", timezone: "Europe/Madrid", flag: "🇪🇸" },
  { name: "阿姆斯特丹", timezone: "Europe/Amsterdam", flag: "🇳🇱" },
  { name: "雅典", timezone: "Europe/Athens", flag: "🇬🇷" },
  
  // 北美洲
  { name: "纽约", timezone: "America/New_York", flag: "🇺🇸" },
  { name: "洛杉矶", timezone: "America/Los_Angeles", flag: "🇺🇸" },
  { name: "芝加哥", timezone: "America/Chicago", flag: "🇺🇸" },
  { name: "多伦多", timezone: "America/Toronto", flag: "🇨🇦" },
  { name: "墨西哥城", timezone: "America/Mexico_City", flag: "🇲🇽" },
  
  // 南美洲
  { name: "里约热内卢", timezone: "America/Sao_Paulo", flag: "🇧🇷" },
  { name: "布宜诺斯艾利斯", timezone: "America/Buenos_Aires", flag: "🇦🇷" },
  { name: "圣地亚哥", timezone: "America/Santiago", flag: "🇨🇱" },
  
  // 非洲
  { name: "开罗", timezone: "Africa/Cairo", flag: "🇪🇬" },
  { name: "约翰内斯堡", timezone: "Africa/Johannesburg", flag: "🇿🇦" },
  { name: "拉各斯", timezone: "Africa/Lagos", flag: "🇳🇬" },
  
  // 大洋洲
  { name: "悉尼", timezone: "Australia/Sydney", flag: "🇦🇺" },
  { name: "奥克兰", timezone: "Pacific/Auckland", flag: "🇳🇿" },
  { name: "墨尔本", timezone: "Australia/Melbourne", flag: "🇦🇺" }
];

// 辅助工具：字节转十六进制
const byteToHex = Array.from({ length: 256 }, (_, i) =>
  (i + 256).toString(16).slice(1)
);

export default {
  async fetch(request, env) {
    // 验证身份
    if (!agentId) {
      return new Response('身份验证失败，请检查连接', {
        status: 404,
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      });
    }

    // 从环境变量获取服务器配置
    serverHost = env.SERVER_HOST || serverHost;

    const url = new URL(request.url);

    // 根路径返回时钟界面
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response(renderTimeComparisonUI(), {
        headers: { 'content-type': 'text/html;charset=utf-8' }
      });
    }

    // 处理WebSocket连接
    return handleConnection(request);
  },
};

/** 渲染全球时间对比界面 */
function renderTimeComparisonUI() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>全球时间对比工具</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        body {
          background: #f5f7fa;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          color: #333;
        }
        
        .time-container {
          background: #ffffff;
          width: 100%;
          max-width: 1400px;
          margin: 30px auto;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .logo {
          font-size: 2.2rem;
          margin-bottom: 10px;
          color: #2c3e50;
          font-weight: 600;
        }
        
        .description {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
          line-height: 1.6;
          padding: 0 10px;
        }
        
        .controls {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .search-box {
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          width: 250px;
          transition: all 0.2s ease;
        }
        
        .search-box:focus {
          outline: none;
          border-color: #4285f4;
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
        
        .filter-btn {
          padding: 10px 20px;
          background-color: #f0f0f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .filter-btn:hover, .filter-btn.active {
          background-color: #4285f4;
          color: white;
        }
        
        .clock-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        
        .clock-card {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid #eee;
        }
        
        .clock-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.07);
        }
        
        .city-name {
          font-size: 1.2rem;
          margin-bottom: 10px;
          color: #2c3e50;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .time-display {
          font-size: 1.8rem;
          font-weight: 600;
          margin: 10px 0;
          color: #333;
          font-family: 'Courier New', monospace;
        }
        
        .date-display {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 15px;
        }
        
        .timezone {
          font-size: 0.8rem;
          color: #999;
          font-style: italic;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #999;
          font-size: 0.9rem;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        
        @media (max-width: 768px) {
          .time-container {
            padding: 20px;
            margin: 15px auto;
          }
          
          .logo {
            font-size: 1.8rem;
          }
          
          .clock-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
          
          .time-display {
            font-size: 1.4rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="time-container">
        <div class="header">
          <h1 class="logo">全球时间对比工具</h1>
          <p class="subtitle">实时显示世界各地城市时间</p>
        </div>
        
        <p class="description">
          轻松查看全球主要城市的当前时间，支持跨时区协作与沟通。
        </p>
        
        <div class="controls">
          <input type="text" class="search-box" id="citySearch" placeholder="搜索城市...">
          <button class="filter-btn active" data-filter="all">全部</button>
          <button class="filter-btn" data-filter="asia">亚洲</button>
          <button class="filter-btn" data-filter="europe">欧洲</button>
          <button class="filter-btn" data-filter="americas">美洲</button>
          <button class="filter-btn" data-filter="africa">非洲</button>
          <button class="filter-btn" data-filter="oceania">大洋洲</button>
        </div>
        
        <div class="clock-grid" id="clockGrid">
          <!-- 时钟卡片将通过JavaScript动态生成 -->
        </div>
        
        <div class="footer">
          基于Cloudflare Workers构建
        </div>
      </div>
      
      <script>
        // 城市数据 - 与后端保持一致
        const WORLD_CITIES = ${JSON.stringify(WORLD_CITIES)};
        
        // 为城市添加地区分类
        const CITIES_WITH_REGIONS = WORLD_CITIES.map(city => {
          let region = 'other';
          // 亚洲城市
          if ([
            'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Kolkata', 
            'Asia/Dubai', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Kuala_Lumpur',
            'Asia/Tehran', 'Europe/Istanbul'
          ].includes(city.timezone)) {
            region = 'asia';
          } 
          // 欧洲城市
          else if ([
            'Europe/London', 'Europe/Moscow', 'Europe/Paris', 'Europe/Berlin', 
            'Europe/Rome', 'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Athens'
          ].includes(city.timezone)) {
            region = 'europe';
          } 
          // 美洲城市
          else if ([
            'America/New_York', 'America/Los_Angeles', 'America/Chicago',
            'America/Toronto', 'America/Mexico_City', 'America/Sao_Paulo',
            'America/Buenos_Aires', 'America/Santiago'
          ].includes(city.timezone)) {
            region = 'americas';
          } 
          // 非洲城市
          else if ([
            'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos'
          ].includes(city.timezone)) {
            region = 'africa';
          } 
          // 大洋洲城市
          else if ([
            'Australia/Sydney', 'Pacific/Auckland', 'Australia/Melbourne'
          ].includes(city.timezone)) {
            region = 'oceania';
          }
          return { ...city, region };
        });
        
        // 格式化日期
        function formatDate(date) {
          return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short'
          }).format(date);
        }
        
        // 格式化时间 - 增加毫秒显示
        function formatTime(date, timezone) {
          return new Intl.DateTimeFormat('zh-CN', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 1,
            hour12: false
          }).format(date);
        }
        
        // 创建时钟卡片
        function createClockCard(city) {
          const card = document.createElement('div');
          card.className = 'clock-card';
          card.dataset.timezone = city.timezone;
          card.dataset.region = city.region;
          card.dataset.name = city.name.toLowerCase();
          
          card.innerHTML = \`
            <div class="city-name">\${city.flag} \${city.name}</div>
            <div class="time-display" data-time="true"></div>
            <div class="date-display" data-date="true"></div>
            <div class="timezone">\${city.timezone}</div>
          \`;
          
          return card;
        }
        
        // 初始化时钟网格
        function initClockGrid() {
          const grid = document.getElementById('clockGrid');
          CITIES_WITH_REGIONS.forEach(city => {
            grid.appendChild(createClockCard(city));
          });
          
          // 初始化筛选功能
          initFilters();
        }
        
        // 初始化筛选功能
        function initFilters() {
          const filterButtons = document.querySelectorAll('.filter-btn');
          const searchBox = document.getElementById('citySearch');
          const clockCards = document.querySelectorAll('.clock-card');
          
          // 地区筛选
          filterButtons.forEach(button => {
            button.addEventListener('click', () => {
              // 更新按钮状态
              filterButtons.forEach(btn => btn.classList.remove('active'));
              button.classList.add('active');
              
              const filter = button.dataset.filter;
              filterCards(filter, searchBox.value.toLowerCase());
            });
          });
          
          // 搜索筛选
          searchBox.addEventListener('input', () => {
            const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
            filterCards(activeFilter, searchBox.value.toLowerCase());
          });
        }
        
        // 筛选卡片
        function filterCards(regionFilter, searchTerm) {
          const clockCards = document.querySelectorAll('.clock-card');
          
          
          clockCards.forEach(card => {
            const regionMatch = regionFilter === 'all' || card.dataset.region === regionFilter;
            const searchMatch = !searchTerm || card.dataset.name.includes(searchTerm);
            
            if (regionMatch && searchMatch) {
              card.style.display = 'block';
            } else {
              card.style.display = 'none';
            }
          });
        }
        
        // 更新所有时钟
        function updateAllClocks() {
          const now = new Date();
          const clockCards = document.querySelectorAll('.clock-card');
          
          clockCards.forEach(card => {
            const timezone = card.dataset.timezone;
            const timeElement = card.querySelector('[data-time="true"]');
            const dateElement = card.querySelector('[data-date="true"]');
            
            timeElement.textContent = formatTime(now, timezone);
            dateElement.textContent = formatDate(new Date(now.toLocaleString('en-US', { timeZone: timezone })));
          });
        }
        
        // 页面加载时初始化
        window.addEventListener('load', function() {
          initClockGrid();
          updateAllClocks();
          // 每100毫秒更新一次时钟，确保时间实时刷新
          setInterval(updateAllClocks, 100);
        });
      </script>
    </body>
    </html>
  `;
}

/** 处理WebSocket连接 */
async function handleConnection(request) {
  const { 0: clientSocket, 1: serverSocket } = Object.values(new WebSocketPair());
  serverSocket.accept();

  let serverConnection = { value: null };
  let isSignalQuery = false;

  const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';
  const clientReadStream = createClientReadStream(serverSocket, earlyDataHeader);

  clientReadStream.pipeTo(new WritableStream({
    async write(chunk) {
      if (isSignalQuery) {
        return processSignalRequest(chunk, serverSocket, null);
      }

      if (serverConnection.value) {
        const writer = serverConnection.value.writable.getWriter();
        await writer.write(chunk);
        writer.releaseLock();
        return;
      }

      // 解析协议头
      const {
        hasError,
        message,
        addressType,
        portRemote = 443,
        addressRemote = '',
        rawDataIndex,
        protocolVersion = new Uint8Array([0, 0]),
        isUDP
      } = parseProtocolHeader(chunk, agentId);

      if (hasError) throw new Error(message);

      if (isUDP) {
        if (portRemote !== 53) throw new Error();
        isSignalQuery = true;
        return processSignalRequest(
          chunk.slice(rawDataIndex),
          serverSocket,
          new Uint8Array([protocolVersion[0], 0])
        );
      }

      establishServerConnection(
        serverConnection,
        addressType,
        addressRemote,
        portRemote,
        chunk.slice(rawDataIndex),
        serverSocket,
        new Uint8Array([protocolVersion[0], 0])
      );
    }
  })).catch(() => {});

  return new Response(null, { status: 101, webSocket: clientSocket });
}

/** 建立到服务器的TCP连接 */
async function establishServerConnection(
  serverConnection,
  addressType,
  addressRemote,
  portRemote,
  rawClientData,
  serverSocket,
  header
) {
  async function connectAndSend(address, port) {
    const tcpConnection = connect({ hostname: address, port });
    serverConnection.value = tcpConnection;
    const writer = tcpConnection.writable.getWriter();
    await writer.write(rawClientData);
    writer.releaseLock();
    return tcpConnection;
  }

  async function retryConnection() {
    await new Promise(r => setTimeout(r, 1));
    const tcpConnection = await connectAndSend(serverHost || addressRemote, portRemote);
    tcpConnection.closed.finally(() => safeCloseConnection(serverSocket));
    forwardToClient(tcpConnection, serverSocket, header, null);
  }

  let tcpConnection = await connectAndSend(addressRemote, portRemote);
  forwardToClient(tcpConnection, serverSocket, header, retryConnection);
}

/** 创建客户端WebSocket读流 */
function createClientReadStream(serverSocket, earlyDataHeader) {
  let cancel = false;
  return new ReadableStream({
    start(controller) {
      serverSocket.addEventListener('message', e => {
        if (!cancel) controller.enqueue(e.data);
      });
      serverSocket.addEventListener('close', () => {
        safeCloseConnection(serverSocket);
        if (!cancel) controller.close();
      });
      serverSocket.addEventListener('error', err => {
        controller.error(err);
      });
      const { earlyData } = base64ToBuffer(earlyDataHeader);
      if (earlyData) controller.enqueue(earlyData);
    },
    cancel() {
      if (!cancel) {
        cancel = true;
        safeCloseConnection(serverSocket);
      }
    }
  });
}

/** 解析协议头 */
function parseProtocolHeader(buffer, agentId) {
  if (buffer.byteLength < 24) return { hasError: true, message: '协议头不完整' };

  const version = new Uint8Array(buffer.slice(0, 1));
  const agentIdArray = new Uint8Array(buffer.slice(1, 17));
  if (bytesToId(agentIdArray) !== agentId) {
    return { hasError: true, message: '身份验证失败' };
  }

  const optLength = new Uint8Array(buffer.slice(17, 18))[0];
  const command = new Uint8Array(buffer.slice(18 + optLength, 19 + optLength))[0];
  const isUDP = command === 2;
  if (![1, 2].includes(command)) return { hasError: true, message: '不支持的命令' };

  const portIndex = 18 + optLength + 1;
  const portRemote = new DataView(buffer.slice(portIndex, portIndex + 2)).getUint16(0);

  let addressIndex = portIndex + 2;
  let addressType = new Uint8Array(buffer.slice(addressIndex, addressIndex + 1))[0];
  let addressValueIndex = addressIndex + 1;
  let addressValue = '';

  switch (addressType) {
    case 1: // IPv4
      addressValue = new Uint8Array(buffer.slice(addressValueIndex, addressValueIndex + 4)).join('.');
      addressValueIndex += 4;
      break;
    case 2: // 域名
      const len = new Uint8Array(buffer.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex++;
      addressValue = new TextDecoder().decode(buffer.slice(addressValueIndex, addressValueIndex + len));
      addressValueIndex += len;
      break;
    case 3: // IPv6
      const dv = new DataView(buffer.slice(addressValueIndex, addressValueIndex + 16));
      addressValue = Array.from({ length: 8 }, (_, i) => dv.getUint16(i * 2).toString(16)).join(':');
      addressValueIndex += 16;
      break;
    default:
      return { hasError: true, message: '不支持的地址类型' };
  }

  if (!addressValue) return { hasError: true, message: '无效的地址' };

  return {
    hasError: false,
    addressRemote: addressValue,
    addressType,
    portRemote,
    rawDataIndex: addressValueIndex,
    protocolVersion: version,
    isUDP
  };
}

/** 转发服务器数据到客户端 */
async function forwardToClient(remoteConnection, serverSocket, header, retry) {
  let hasIncomingData = false;
  let responseHeader = header;

  await remoteConnection.readable.pipeTo(new WritableStream({
    async write(chunk) {
      hasIncomingData = true;
      if (serverSocket.readyState !== CONNECTION_ESTABLISHED) return;
      serverSocket.send(responseHeader
        ? combineBuffers(responseHeader, new Uint8Array(chunk))
        : chunk
      );
      responseHeader = null;
    }
  })).catch(() => safeCloseConnection(serverSocket));

  if (!hasIncomingData && retry) retry();
}

/** 合并两个Uint8Array缓冲区 */
function combineBuffers(arr1, arr2) {
  const result = new Uint8Array(arr1.length + arr2.length);
  result.set(arr1, 0);
  result.set(arr2, arr1.length);
  return result.buffer;
}

/** Base64字符串转ArrayBuffer */
function base64ToBuffer(base64Str) {
  if (!base64Str) return { error: null };
  try {
    const decode = atob(base64Str.replace(/-/g, '+').replace(/_/g, '/'));
    return {
      earlyData: Uint8Array.from(decode, c => c.charCodeAt(0)).buffer,
      error: null
    };
  } catch {
    return { error: true };
  }
}

/** 安全关闭WebSocket连接 */
function safeCloseConnection(socket) {
  if (socket.readyState < CONNECTION_TERMINATING) socket.close();
}

/** 字节数组转ID字符串 */
function bytesToId(arr, offset = 0) {
  return [
    byteToHex[arr[offset]] + byteToHex[arr[offset + 1]] +
    byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]],
    byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]],
    byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]],
    byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]],
    byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] +
    byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] +
    byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]
  ].join('-').toLowerCase();
}

/** 处理信号查询 */
async function processSignalRequest(udpChunk, serverSocket, header) {
  try {
    const signalConnection = connect({ hostname: '8.8.4.4', port: 53 });
    const writer = signalConnection.writable.getWriter();
    await writer.write(udpChunk);
    writer.releaseLock();

    let protocolHeader = header;
    await signalConnection.readable.pipeTo(new WritableStream({
      async write(chunk) {
        if (serverSocket.readyState === CONNECTION_ESTABLISHED) {
          serverSocket.send(protocolHeader
            ? combineBuffers(protocolHeader, new Uint8Array(chunk))
            : chunk
          );
          protocolHeader = null;
        }
      }
    }));
  } catch {}
}
