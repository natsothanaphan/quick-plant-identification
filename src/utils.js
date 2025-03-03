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

export {
  alertAndLogErr,
  convertFileToBase64,
};
