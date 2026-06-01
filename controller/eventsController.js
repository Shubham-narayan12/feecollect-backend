// ==========================================
// controllers/eventController.js
// ==========================================

import eventModel from "../model/eventsModel.js";

// ==========================================
// CREATE EVENT
// ==========================================
export const createEvent = async (req, res) => {
  try {
    const { eventTitle, eventDate, eventDescription } = req.body;

    if (!eventTitle || !eventDate) {
      return res.status(400).json({
        success: false,
        message: "Event title and date are required",
      });
    }

    const newEvent = await eventModel.create({
      eventTitle,
      eventDate,
      eventDescription,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL EVENTS
// ==========================================
export const getAllEvent = async (req, res) => {
  try {
    const events = await eventModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalEvents: events.length,
      events,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET SINGLE EVENT
// ==========================================
export const getSingleEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await eventModel.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE EVENT
// ==========================================
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const { eventTitle, eventDate, eventDescription } = req.body;

    const updatedEvent = await eventModel.findByIdAndUpdate(
      id,
      {
        eventTitle,
        eventDate,
        eventDescription,
      },
      {
        new: true,
      },
    );

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE EVENT
// ==========================================
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEvent = await eventModel.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
