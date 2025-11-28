// Helper module to access Socket.io instance from routes/services
let ioInstance = null;

export function setIO(io) {
  ioInstance = io;
}

export function getIO() {
  return ioInstance;
}
