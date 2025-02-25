const alertAndLogErr = (err) => {
  console.error(err);
  alert(err.message);
};

const convertFileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = () => {
    if (typeof reader.result === 'string') {
      // Remove the prefix: "data:image/jpeg;base64," or "data:image/png;base64,"
      const base64Str = reader.result.substring(reader.result.indexOf('base64,') + 7);
      resolve(base64Str);
    } else {
      resolve(reader.result);
    }
  };
  reader.onerror = (error) => reject(error);
});

export {
  alertAndLogErr,
  convertFileToBase64,
};
