const vacancyService = require('../services/vacancyService');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const vacancy = await vacancyService.createVacancy(req.user._id, req.body);
  res.status(201).json({ status: 'success', message: 'Vacancy created.', data: { vacancy } });
});

const getMine = asyncHandler(async (req, res) => {
  const result = await vacancyService.getMyVacancies(req.user._id, req.query);
  res.json({ status: 'success', data: result });
});

const browse = asyncHandler(async (req, res) => {
  const result = await vacancyService.browseVacancies(req.query);
  res.json({ status: 'success', data: result });
});

const getById = asyncHandler(async (req, res) => {
  const vacancy = await vacancyService.getVacancyById(req.params.id);
  res.json({ status: 'success', data: { vacancy } });
});

const update = asyncHandler(async (req, res) => {
  const vacancy = await vacancyService.updateVacancy(req.user._id, req.params.id, req.body);
  res.json({ status: 'success', message: 'Vacancy updated.', data: { vacancy } });
});

const changeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const vacancy = await vacancyService.changeStatus(req.user._id, req.params.id, status);
  res.json({ status: 'success', message: `Vacancy ${status}.`, data: { vacancy } });
});

const remove = asyncHandler(async (req, res) => {
  await vacancyService.deleteVacancy(req.user._id, req.params.id);
  res.json({ status: 'success', message: 'Vacancy deleted.' });
});

module.exports = { create, getMine, browse, getById, update, changeStatus, remove };
