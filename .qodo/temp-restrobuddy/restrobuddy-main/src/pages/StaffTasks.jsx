import React, { useState, useEffect } from "react";
import { StaffTask } from "@/entities/StaffTask";
import { Employee } from "@/entities/Employee";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle, Clock, AlertCircle, Plus, User, MapPin,
  Utensils, Package, Wrench, HelpCircle, PlayCircle
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function StaffTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-tasks");

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    task_type: "other",
    priority: "medium",
    assigned_to: "",
    assigned_to_name: "",
    location: "",
    estimated_duration: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [allEmployees, allTasks] = await Promise.all([
        Employee.list(),
        StaffTask.list("-created_date", 200)
      ]);

      setEmployees(allEmployees);
      setTasks(allTasks);

      // Find current employee
      const emp = allEmployees.find(e => e.email === user.email);
      setCurrentEmployee(emp);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assigned_to) {
      alert("Please fill in required fields");
      return;
    }

    try {
      const assignedEmployee = employees.find(e => e.id === newTask.assigned_to);

      await StaffTask.create({
        ...newTask,
        assigned_to_name: assignedEmployee?.full_name || "",
        created_by: currentEmployee?.id || currentUser?.email,
        created_by_name: currentEmployee?.full_name || currentUser?.full_name,
        status: "pending",
        estimated_duration: newTask.estimated_duration ? parseInt(newTask.estimated_duration) : undefined
      });

      setShowCreateDialog(false);
      setNewTask({
        title: "",
        description: "",
        task_type: "other",
        priority: "medium",
        assigned_to: "",
        assigned_to_name: "",
        location: "",
        estimated_duration: ""
      });

      await loadData();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        ...(newStatus === 'completed' ? { completed_date: new Date().toISOString() } : {})
      };

      await StaffTask.update(taskId, updateData);
      await loadData();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    }
  };

  const taskTypeIcons = {
    table_cleaning: MapPin,
    order_prep: Utensils,
    inventory_check: Package,
    customer_service: User,
    maintenance: Wrench,
    other: HelpCircle
  };

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800"
  };

  const statusColors = {
    pending: "bg-slate-100 text-slate-800",
    in_progress: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const myTasks = tasks.filter(task => 
    task.assigned_to === currentEmployee?.id && task.status !== 'completed' && task.status !== 'cancelled'
  );

  const allActiveTasks = tasks.filter(task => 
    task.status !== 'completed' && task.status !== 'cancelled'
  );

  const completedTasks = tasks.filter(task => 
    task.status === 'completed'
  );

  const TaskCard = ({ task }) => {
    const TaskIcon = taskTypeIcons[task.task_type];
    const isMyTask = task.assigned_to === currentEmployee?.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className={`border-2 ${isMyTask ? 'border-emerald-500' : ''}`}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-10 h-10 rounded-lg ${
                  task.priority === 'urgent' ? 'bg-red-100' :
                  task.priority === 'high' ? 'bg-orange-100' :
                  task.priority === 'medium' ? 'bg-yellow-100' :
                  'bg-blue-100'
                } flex items-center justify-center`}>
                  <TaskIcon className={`w-5 h-5 ${
                    task.priority === 'urgent' ? 'text-red-600' :
                    task.priority === 'high' ? 'text-orange-600' :
                    task.priority === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                  )}
                  {task.location && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                      <MapPin className="w-3 h-3" />
                      <span>{task.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Badge className={priorityColors[task.priority]}>
                  {task.priority}
                </Badge>
                <Badge className={statusColors[task.status]}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{task.assigned_to_name}</span>
                </div>
                {task.estimated_duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{task.estimated_duration} min</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(task.created_date), 'MMM d, h:mm a')}</span>
                </div>
              </div>

              {isMyTask && task.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <PlayCircle className="w-3 h-3 mr-1" />
                  Start
                </Button>
              )}

              {isMyTask && task.status === 'in_progress' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Button>
              )}

              {task.status === 'completed' && task.completed_date && (
                <div className="text-xs text-green-600 font-semibold">
                  ✓ {format(new Date(task.completed_date), 'MMM d, h:mm a')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Staff Tasks</h1>
            <p className="text-slate-600">Manage and track team assignments</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Task Title *</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="e.g., Clean Table 5"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Additional details..."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Task Type *</Label>
                    <Select
                      value={newTask.task_type}
                      onValueChange={(value) => setNewTask({...newTask, task_type: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table_cleaning">Table Cleaning</SelectItem>
                        <SelectItem value="order_prep">Order Prep</SelectItem>
                        <SelectItem value="inventory_check">Inventory Check</SelectItem>
                        <SelectItem value="customer_service">Customer Service</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priority *</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) => setNewTask({...newTask, priority: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assign To *</Label>
                    <Select
                      value={newTask.assigned_to}
                      onValueChange={(value) => setNewTask({...newTask, assigned_to: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.filter(e => e.status === 'active' || e.status === 'on_break').map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name} ({emp.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Estimated Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={newTask.estimated_duration}
                      onChange={(e) => setNewTask({...newTask, estimated_duration: e.target.value})}
                      placeholder="15"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Location</Label>
                  <Input
                    value={newTask.location}
                    onChange={(e) => setNewTask({...newTask, location: e.target.value})}
                    placeholder="e.g., Table 5, Kitchen, Bar"
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handleCreateTask}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                My Active Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{myTasks.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                All Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{allActiveTasks.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {completedTasks.filter(t => {
                  const today = new Date().toDateString();
                  return new Date(t.completed_date).toDateString() === today;
                }).length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Urgent Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {allActiveTasks.filter(t => t.priority === 'urgent').length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-2 rounded-xl shadow-md">
            <TabsTrigger value="my-tasks" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              My Tasks ({myTasks.length})
            </TabsTrigger>
            <TabsTrigger value="all-tasks" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />
              All Active ({allActiveTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {myTasks.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-slate-900 mb-2">All caught up!</p>
                    <p className="text-slate-600">You have no active tasks assigned</p>
                  </div>
                ) : (
                  myTasks.map(task => <TaskCard key={task.id} task={task} />)
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="all-tasks" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {allActiveTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {completedTasks.slice(0, 50).map(task => <TaskCard key={task.id} task={task} />)}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}