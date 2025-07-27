export const questConfig = {
  GET_STARTED_QUESTID:
    import.meta.env.VITE_GET_STARTED_QUESTID ?? process.env.VITE_GET_STARTED_QUESTID,
  USER_ID:
    import.meta.env.VITE_QUEST_USER_ID ?? process.env.VITE_QUEST_USER_ID,
  APIKEY: import.meta.env.VITE_QUEST_APIKEY ?? process.env.VITE_QUEST_APIKEY,
  TOKEN: import.meta.env.VITE_QUEST_TOKEN ?? process.env.VITE_QUEST_TOKEN,
  ENTITYID: import.meta.env.VITE_QUEST_ENTITYID ?? process.env.VITE_QUEST_ENTITYID,
  PRIMARY_COLOR:
    import.meta.env.VITE_QUEST_PRIMARY_COLOR ?? process.env.VITE_QUEST_PRIMARY_COLOR,
  
  // Validation function
  isValid() {
    return !!(this.APIKEY && this.ENTITYID && this.GET_STARTED_QUESTID);
  }
};