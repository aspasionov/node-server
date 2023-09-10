const { Router } = require('express')
const checkAuth = require('../helper/auth')
const mongoose = require('mongoose');
const Column = require('../models/column');
const Task = require('../models/task');
const router = Router()

const mappedCards = (cards) => cards.map(card => ({
  ...card,
  id: card._id
}))

router.get('/', checkAuth, async (req, res) => {
  try {
    const columns = await Column.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      {
        $lookup: {
          from: 'tasks',
          let: { columnId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$columnId', '$$columnId'] },
              },
            },
            {
              $sort: { order: 1 }
            },
            {
              $project: {
                title: 1,
                description: 1,
                label: 1,
                order: 1,
                columnId: 1,
                background: 1
              },
            }
          ],
          as: 'cards',
        },
      },
    ])

    const copyColumns = columns.map(el => {
        const id = el._id.toString()
        delete el._id;
        return {
          ...el,
          id,
          cards: el?.cards?.length ? mappedCards(el.cards) : []
        }
    })

    res.status(200).json({
      data: copyColumns
    })
  } catch(err) {
    console.log(err)
    res.status(400).json({
      message: "something went wrong"
    })
  }
})

router.post('/', checkAuth, async (req, res) => {
  try {
    const {title, label} = req.body

    const doc = await new Column({
      title, label, cards: [], userId: req.userId
    })

    await doc.save()

    res.status(201).json(doc._doc)
  } catch(e) {
    console.log(e)
    res.status(400).json({
      message: "somesing went wrong"
    })
  }
})

router.patch('/:id', checkAuth, async (req, res) => {
  try {
    const {title, label} = req.body

    const doc = await Column.findOneAndUpdate({
      _id: req.params.id
    }, {
      title,
      label
    },
    {
      returnDocument: 'after'
    })

    if(!doc) {
      res.status(404).json({
        message: 'sorry I can`t find a document'
      })
    }

    await doc.save()

    res.status(201).json(doc._doc)

  } catch(e) {
    console.log(e)
    res.status(400).json({
      message: "something went wrong"
    })
  }
})

router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const doc = await Column.deleteOne({
        _id: req.params.id
      })


    if(!doc) {
      return res.status(404).json({
        message: 'sorry I can`t delete a document'
      })
    }

    await Task.deleteMany({
      columnId: req.params.id
    })

    res.status(200).json({
      message: `Column "${req.params.id}" deleted successfully`
    })

  } catch(e) {
    console.log(e)
    res.status(400).json({
      message: "something went wrong"
    })
  }
})

module.exports = router
