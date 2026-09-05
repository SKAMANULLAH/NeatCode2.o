import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messagesByProblem: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,

  reducers: {
    setMessages: (state, action) => {
      const { problemId, messages } = action.payload;

      state.messagesByProblem[problemId] = messages;
    },
  },
});

export const { setMessages } = chatSlice.actions;

export default chatSlice.reducer;
