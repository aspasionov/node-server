const { Router } = require('express')
const checkAuth = require('../helper/auth')
const { validationResult } = require('express-validator')
const Task = require('../models/task')
const { taskValidator } = require('../validators/index')
const fileUploader  = require('../helper/fileUpload')
const Column = require('../models/column');

const router = Router()

router.post('/', checkAuth, taskValidator, async (req, res) => {
  try {
    const err = validationResult(req)

    if(!err.isEmpty()) {
      return res.status(400).json({
        errors: err.array().map(({ msg, path }) => ({ [path]: msg}))
      })
    }
    const { label, title, description, draggable, columnId, order } = req.body
    const currentColumn = await Column.findById(columnId)

    const task = new Task({
      label,
      draggable,
      title,
      order,
      columnId,
      description
    })

    currentColumn.addCard(task)

    task.save()
    res.status(201).json(task._doc)
  } catch (e) {
    console.log(e);
    res.status(404).json({
      message: 'something went wrong'
    })
  }
})

router.get('/:id', checkAuth, async (req, res) => {
  try {
    const currentTask = await Task.findById(req.params.id)

    const currentColumn = await Column.findById(currentTask.columnId)

    if(currentColumn.userId.toString() !== req.userId) return res.status(403).json({
      message: 'Card is not allowed'
    })

    res.status(200).json({
      ...currentTask._doc,
      id: currentTask._id,
    })
  } catch (e) {
    console.log(e);
    res.status(404).json({
      message: 'something went wrong'
    })
  }
})

router.delete('/:id',checkAuth,  async (req, res) => {
  try {
    const doc = await Task.deleteOne({
      _id: req.params.id
    })

    if(!doc) {
      return res.status(404).json({
        message: 'sorry I can`t delete a document'
      })
    }

    res.status(200).json({
      message: `Task "${req.params.id}" deleted successfully`
    })
  } catch (e) {
    console.log(e);
    res.status(404).json({
      message: 'something went wrong'
    })
  }
})

router.patch('/:id', checkAuth, async (req, res) => {
  try {
    const { title, description, label, columnId, order, prevColumnId } = req.body

    const updatedCard = await Task.findOne({
      _id: req.params.id
    })

    if(prevColumnId === columnId) {
        await Task.updateMany(
          {
            $and: [
              { order: order > updatedCard.order ? { $lte: order } : { $gte: order } },
              { order: order > updatedCard.order ? { $gte: updatedCard.order } : { $lte: updatedCard.order } },
              { columnId: updatedCard.columnId, }
            ]
          },
          {
            $inc: {
              order: order > updatedCard.order ? -1 : +1
            }
          }
        );

      Object.assign(updatedCard, {
        order,
      })

        await updatedCard.save()
      return res.status(200).json(updatedCard._doc)
    }

    if(prevColumnId) {
       await Task.updateMany({
        $and: [
          { order: { $gt: updatedCard.order } },
          { columnId: prevColumnId, }
        ]
      },
        { $inc: { order: -1 } }
      );
    }

    Object.assign(updatedCard, {title,
      label,
      order,
      description,
      columnId
    })

    if (updatedCard) {
      await Task.updateMany({
          $and: [
            { order: { $gte: order } },
            { columnId, }
          ]
      },
        { $inc: { order: +1 } }
      );

      await updatedCard.save();
    } else {
      return res.status(404).json({
        message: 'sorry I can`t update the document'
      })
    }
    res.status(200).json(updatedCard._doc)
  } catch (e) {
    console.log(e);
    res.status(404).json({
      message: 'something went wrong'
    })
  }
})

router.post('/files/:id', checkAuth, fileUploader.single('background'),  async (req, res) => {
  try {
    res.setHeader('Content-Type', 'image/png')
    const task = await Task.findById(req.params.id)

    if(!task) {
      return res.status(400).json({
        message: 'Task now found'
      })
    }

    task.background = req.file.path

    task.save()
    res.status(200).json({
      message: `Background added to task ${req.params.id}`
    })

  } catch(e) {
    console.log(e);
    res.status(404).json({ message: 'Something went wrong' })
  }
})


module.exports = router
