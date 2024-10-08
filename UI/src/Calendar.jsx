import React, { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Plus, Trash, CircleFadingPlus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import axios from 'axios'

export default function Component() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)

  const changeMonth = (amount) => {
    setCurrentDate(prevDate => amount > 0 ? addMonths(prevDate, 1) : subMonths(prevDate, 1))
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  const getDayEvents = (day) => events.filter(event => isSameDay(parseISO(event.date.toISOString()), day))

  const addEvent = (newEvent) => {
    setEvents(prevEvents => [...prevEvents, {
      ...newEvent,
      potentialForError: 'unknown',
      similarPastChanges: 'unknown'
    }])
    toast.success("Event added successfully!")
  }

  const deleteEvent = (eventId) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId))
    toast.success("Event deleted successfully!")
  }

  const updateEventAnalysis = (eventId, analysis) => {
    setEvents(prevEvents => prevEvents.map(event => 
      event.id === eventId 
        ? { ...event, ...analysis }
        : event
    ))
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full h-[90vh] max-w-7xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Calendar</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-4rem)]">
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
            <ResizablePanel defaultSize={33}>
              <div className="p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
                  <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-sm font-medium text-gray-500">{day}</div>
                  ))}
                  {daysInMonth.map(day => (
                    <Button
                      key={day.toString()}
                      variant="ghost"
                      className={`p-2 ${isSameMonth(day, currentDate) ? 'text-gray-300' : 'text-gray-300'} ${
                        isSameDay(day, selectedDate) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      {format(day, 'd')}
                    </Button>
                  ))}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={33}>
              <div className="p-4 h-full overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Events for {format(selectedDate, 'MMMM d, yyyy')}</h2>
                {getDayEvents(selectedDate).length > 0 ? (
                  <div className="space-y-4">
                    {getDayEvents(selectedDate).map(event => (
                      <div key={event.id} className="flex items-center justify-between space-x-4 bg-white p-3 rounded-md shadow">
                        <div className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${event.color}`} />
                          <div>
                            <h3 className="font-medium">{event.title}</h3>
                          </div>
                        </div>
                        <EventDetailsDialog event={event} onDelete={deleteEvent} updateEventAnalysis={updateEventAnalysis} />
                      </div>
                    ))}
                    <AddEventDialog onAddEvent={addEvent} selectedDate={selectedDate} />
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">No events scheduled for this day</p>
                    <AddEventDialog onAddEvent={addEvent} selectedDate={selectedDate} />
                  </div>
                )}
              </div>
            </ResizablePanel>    
          </ResizablePanelGroup>
        </CardContent>
      </Card>
    </div>
  )
}

function AddEventDialog({ onAddEvent, selectedDate }) {
  const [isOpen, setIsOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: selectedDate,
    description: '',
    subject: '',
    color: 'bg-blue-400'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newEvent.title && newEvent.date && newEvent.description && newEvent.subject) {
      onAddEvent({
        id: Date.now().toString(),
        ...newEvent
      })
      setIsOpen(false)
      setNewEvent({
        title: '',
        date: selectedDate,
        description: '',
        subject: '',
        color: 'bg-blue-400'
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={format(newEvent.date, 'yyyy-MM-dd')}
              onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={newEvent.subject}
              onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
              required
            />
          </div>
          <Button type="submit">Add Event</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EventDetailsDialog({ event, onDelete, updateEventAnalysis }) {
  const [isOpen, setIsOpen] = useState(false)
  const handleDelete = () => {
    onDelete(event.id)
    setIsOpen(false)
  }
  const handleAnalyze = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8080/api/analyze-change', {
        'Change Subject': event.title,
        'Change description': event.description
      })
      
      // Parse the response
      const analysisText = response.data.analysis
      const potentialForError = analysisText.match(/Potential for error: (Yes|No)/i)?.[1] || 'unknown'
      const similarPastChanges = analysisText.match(/Similar past changes: (.+)/i)?.[1]?.split(', ') || []

      const analysis = {
        potentialForError,
        similarPastChanges: similarPastChanges.length > 0 ? similarPastChanges : 'unknown'
      }

      updateEventAnalysis(event.id, analysis)
      toast.success('Analysis completed.')
    } catch (error) {
      console.error('Error during analysis:', error)
      toast.error('Error during analysis. Check console for details.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <CircleFadingPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <p>{event.title}</p>
          </div>
          <div>
            <Label>Date</Label>
            <p>{format(parseISO(event.date.toISOString()), 'MMMM d, yyyy')}</p>
          </div>
          <div>
            <Label>Description</Label>
            <p>{event.description}</p>
          </div>
          <div>
            <Label>Subject</Label>
            <p>{event.subject}</p>
          </div>
          <div>
            <Label>Potential for Error</Label>
            <p>{event.potentialForError}</p>
          </div>
          <div>
            <Label>Similar Past Changes</Label>
            <p>{Array.isArray(event.similarPastChanges) ? event.similarPastChanges.join(', ') : event.similarPastChanges}</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleDelete} variant="destructive">Delete Event</Button>
            <Button onClick={handleAnalyze} variant="secondary">Analyze Change</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
