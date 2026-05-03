const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// Mapa para llevar la cuenta de los usuarios conectados (socket.id -> username)
const usuariosConectados = new Map();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {

  // Cuando un usuario se une con su nombre
  socket.on('nuevo usuario', (username) => {
    usuariosConectados.set(socket.id, username);

    // Notificamos a todos que un nuevo usuario se ha unido
    io.emit('usuario unido', {
      username: username,
      total: usuariosConectados.size,
      usuarios: Array.from(usuariosConectados.values())
    });
  });

  // Mensaje de chat normal
  socket.on('chat message', (msg) => {
    const username = usuariosConectados.get(socket.id) || 'Anónimo';
    io.emit('chat message', {
      username: username,
      texto: msg,
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      socketId: socket.id
    });
  });

  // Indicador de "está escribiendo"
  socket.on('escribiendo', () => {
    const username = usuariosConectados.get(socket.id);
    if (username) {
      socket.broadcast.emit('escribiendo', username);
    }
  });

  socket.on('dejo de escribir', () => {
    socket.broadcast.emit('dejo de escribir');
  });

  // Cuando un usuario se desconecta (cierre de pestaña o botón Desconectar)
  socket.on('disconnect', () => {
    const username = usuariosConectados.get(socket.id);
    if (username) {
      usuariosConectados.delete(socket.id);
      io.emit('usuario salio', {
        username: username,
        total: usuariosConectados.size,
        usuarios: Array.from(usuariosConectados.values())
      });
    }
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
