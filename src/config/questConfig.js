export const questConfig = {
  GET_STARTED_QUESTID: 'c-greta-get-started',
  USER_ID: 'u-0e2da85c-9044-47a5-a84b-dbe0638e7a35',
  APIKEY: 'k-fc6f25dc-5fa5-4c37-b208-816855129587',
  TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1LTBlMmRhODVjLTkwNDQtNDdhNS1hODRiLWRiZTA2MzhlN2EzNSIsImlhdCI6MTc1MzM3MDQ3NCwiZXhwIjoxNzU1OTYyNDc0fQ.crdJfh0gTtUvVHbYK7uG9RAzLTDrH_WxbRvp5pOT36w',
  ENTITYID: 'e-e8398dae-4adc-4849-b230-5b7e50469f66',
  PRIMARY_COLOR: '#2563eb',
  
  // Validation function
  isValid() {
    return !!(this.APIKEY && this.ENTITYID && this.GET_STARTED_QUESTID);
  }
};