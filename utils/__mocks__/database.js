// Mock connectToDB — prevents connecting to the real MongoDB during tests.
// Integration tests connect to mongodb-memory-server directly via mongoose.
export const connectToDB = jest.fn();
