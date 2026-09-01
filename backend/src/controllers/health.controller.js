const getHealth = (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "CollegeGPT backend is running",
  });
};

module.exports = {
  getHealth,
};