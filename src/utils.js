const alertAndLogErr = (err) => {
  console.error(err);
  alert(err.message || 'An error occurred');
};

const convertFileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = () => {
    const result = reader.result;
    if (typeof result !== 'string') {
      resolve(result);
      return;
    }
    // Remove the prefix: "data:image/jpeg;base64," or "data:image/png;base64,"
    const base64Str = result.substring(result.indexOf('base64,') + 7);
    resolve(base64Str);
  };
  reader.onerror = (err) => reject(err);
});

const formatDay = (timestamp) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimestamp = (timestamp) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const getTimezone = () => -new Date().getTimezoneOffset();

export {
  alertAndLogErr,
  convertFileToBase64,
  formatDay,
  formatTimestamp,
  getTimezone,
};
