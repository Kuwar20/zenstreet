"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, User, Bell, Edit, Trash2, X, Clock, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CalendarApp = () => {
  // State for events and UI
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // State for form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    attachments: []
  });

  // Form reset function
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      attachments: []
    });
  };

  // Event CRUD operations
  const createEvent = (event) => {
    const newEvent = {
      id: Date.now(),
      ...event,
      notifications: true
    };
    setEvents([...events, newEvent]);
    scheduleNotification(newEvent);
  };

  const updateEvent = (id, updatedEvent) => {
    setEvents(events.map(event => 
      event.id === id ? { 
        ...event, 
        ...updatedEvent,
        notifications: true 
      } : event
    ));
    // Reschedule notification for updated event
    scheduleNotification(updatedEvent);
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  // Notification system
  const scheduleNotification = (event) => {
    const eventTime = new Date(`${event.date}T${event.time}`).getTime();
    const currentTime = new Date().getTime();
    const timeUntilEvent = eventTime - currentTime;

    if (timeUntilEvent > 0) {
      setTimeout(() => {
        if (Notification.permission === "granted") {
          const notification = new Notification(event.title, {
            body: event.description,
            tag: event.id
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          setNotifications([...notifications, {
            id: event.id,
            title: event.title,
            time: new Date()
          }]);
        }
      }, timeUntilEvent);
    }
  };

  const snoozeNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      setTimeout(() => {
        new Notification(`Reminder: ${notification.title}`, {
          body: 'This is your snoozed reminder',
          tag: `snoozed-${notification.id}`
        });
      }, 5 * 60 * 1000); // 5 minutes
    }
  };

  // Form validation
  const validateForm = () => {
    return formData.title && formData.date && formData.time;
  };

  // Form submission handler
  const handleSubmit = () => {
    if (validateForm()) {
      if (formData.id) {
        updateEvent(formData.id, formData);
      } else {
        createEvent(formData);
      }
      setShowEventForm(false);
      resetForm();
    }
  };

  // Request notification permissions on mount
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Calendar grid rendering
  const renderCalendarGrid = () => {
    const today = new Date();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-bold p-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {[...Array(daysInMonth)].map((_, index) => {
          const day = index + 1;
          const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = events.filter(event => event.date === dateString);

          return (
            <div
              key={day}
              onClick={() => {
                setSelectedDate(dateString);
                setFormData(prev => ({ ...prev, date: dateString }));
                setShowEventForm(true);
              }}
              className="h-24 p-2 border rounded hover:bg-gray-50 cursor-pointer"
            >
              <div className="font-bold">{day}</div>
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className="text-xs p-1 mb-1 bg-blue-100 rounded flex justify-between items-center group"
                >
                  <span>{event.title}</span>
                  <div className="hidden group-hover:flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(event);
                        setShowEventForm(true);
                      }}
                      className="p-1 hover:bg-blue-200 rounded"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEvent(event.id);
                      }}
                      className="p-1 hover:bg-red-200 rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  // Search events
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const results = events.filter(event => 
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.description.toLowerCase().includes(query.toLowerCase()) ||
        event.date.includes(query)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Calendar App
          </CardTitle>
          <CardDescription>
            Manage your events and receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Search events..."
            />
          </div>
          {renderCalendarGrid()}
        </CardContent>
      </Card>

      {searchQuery && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map(event => (
                  <li key={event.id} className="mb-2 p-2 border rounded">
                    <div className="flex justify-between">
                      <div>
                        <strong>{event.title}</strong>
                        <p>{event.description}</p>
                        <p>{event.date} {event.time}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setFormData(event);
                            setShowEventForm(true);
                          }}
                          className="p-1 hover:bg-blue-200 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-1 hover:bg-red-200 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No events found</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formData.id ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Attachments</label>
              <input
                type="file"
                onChange={(e) => setFormData({
                  ...formData,
                  attachments: [...formData.attachments, e.target.files[0]]
                })}
                className="w-full p-2 border rounded"
                multiple
              />
            </div>
          </form>
          <DialogFooter className="flex justify-between">
            {formData.id && (
              <button
                onClick={() => {
                  deleteEvent(formData.id);
                  setShowEventForm(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            )}
            <div className="space-x-2">
              <button
                onClick={() => {
                  setShowEventForm(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {formData.id ? 'Update' : 'Create'}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {notifications.map(notification => (
        <Alert key={notification.id} className="mb-2">
          <AlertTitle className="flex items-center justify-between">
            <span>{notification.title}</span>
            <div className="space-x-2">
              <button
                onClick={() => snoozeNotification(notification.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Clock className="h-4 w-4" />
              </button>
              <button
                onClick={() => setNotifications(notifications.filter(n => n.id !== notification.id))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </AlertTitle>
          <AlertDescription>
            Scheduled for {new Date(notification.time).toLocaleString()}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default CalendarApp;