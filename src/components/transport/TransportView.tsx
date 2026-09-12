import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { TransportRoute } from '../../types/erp';
import { PageHeader } from '../common/PageHeader';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Bus,
  MapPin,
  Phone,
  User,
  Users,
  Navigation,
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  UserPlus,
  UserMinus,
  Search,
  AlertCircle,
  Car,
} from 'lucide-react';

interface StopItem {
  name: string;
  time: string;
  fee: number;
}

export const TransportView: React.FC = () => {
  const {
    transportRoutes,
    students,
    addTransportRoute,
    updateTransportRoute,
    deleteTransportRoute,
    assignStudentToRoute,
    removeStudentFromRoute,
    showToast,
  } = useERPData();

  const [selectedRouteId, setSelectedRouteId] = useState<string>(transportRoutes[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<TransportRoute | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState<string>('');
  const [assignSearch, setAssignSearch] = useState<string>('');

  // Form State for Add / Edit Route
  const [formData, setFormData] = useState<{
    name: string;
    vehicleNo: string;
    driverName: string;
    driverPhone: string;
    capacity: number;
    monthlyFee: number;
    status: 'On Route' | 'Active' | 'Idle' | 'Completed';
    stops: StopItem[];
  }>({
    name: '',
    vehicleNo: '',
    driverName: '',
    driverPhone: '',
    capacity: 35,
    monthlyFee: 65,
    status: 'Active',
    stops: [
      { name: 'School Central Gate', time: '07:00 AM', fee: 50 },
      { name: 'North Town Circle', time: '07:25 AM', fee: 65 },
    ],
  });

  const [newStopName, setNewStopName] = useState('');
  const [newStopTime, setNewStopTime] = useState('07:30 AM');
  const [newStopFee, setNewStopFee] = useState(65);

  const filteredRoutes = transportRoutes.filter((r) => {
    const rName = r.routeName || r.name || '';
    const vNo = r.vehicleNo || r.vehicleNumber || '';
    const dName = r.driverName || '';
    const matchesSearch =
      rName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeRoute =
    transportRoutes.find((r) => r.id === selectedRouteId) ||
    filteredRoutes[0] ||
    transportRoutes[0];

  const assignedStudents = students.filter(
    (s) => s.transportRoute === (activeRoute?.routeName || activeRoute?.name)
  );

  const unassignedStudents = students.filter(
    (s) => !s.transportRoute || s.transportRoute !== (activeRoute?.routeName || activeRoute?.name)
  );

  const filteredUnassignedStudents = unassignedStudents.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const roll = (s.rollNumber || '').toLowerCase();
    const cls = `${s.class}-${s.section}`.toLowerCase();
    const q = assignSearch.toLowerCase();
    return fullName.includes(q) || roll.includes(q) || cls.includes(q);
  });

  const handleOpenAddRoute = () => {
    setEditingRoute(null);
    setFormData({
      name: `Route ${transportRoutes.length + 1} - `,
      vehicleNo: `BUS-${Math.floor(100 + Math.random() * 900)}`,
      driverName: '',
      driverPhone: '',
      capacity: 40,
      monthlyFee: 70,
      status: 'Active',
      stops: [
        { name: 'School Campus Main Gate', time: '07:00 AM', fee: 50 },
        { name: 'City Center Hub', time: '07:25 AM', fee: 70 },
      ],
    });
    setIsRouteModalOpen(true);
  };

  const handleOpenEditRoute = (route: TransportRoute) => {
    setEditingRoute(route);
    const parsedStops: StopItem[] = (route.stops || []).map((st: any) => {
      if (typeof st === 'string') {
        return { name: st, time: '07:15 AM', fee: route.monthlyFee || 60 };
      }
      return {
        name: st.name || 'Stop',
        time: st.time || '07:15 AM',
        fee: st.fee || route.monthlyFee || 60,
      };
    });

    setFormData({
      name: route.routeName || route.name || '',
      vehicleNo: route.vehicleNo || route.vehicleNumber || '',
      driverName: route.driverName || '',
      driverPhone: route.driverPhone || '',
      capacity: route.capacity || 35,
      monthlyFee: route.monthlyFee || 65,
      status: (route.status as any) || 'Active',
      stops: parsedStops.length > 0 ? parsedStops : [{ name: 'Campus Gate', time: '07:00 AM', fee: 50 }],
    });
    setIsRouteModalOpen(true);
  };

  const handleAddStopToForm = () => {
    if (!newStopName.trim()) {
      showToast('Stop Name Required', 'Please provide a name for the pickup stop.', 'error');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          name: newStopName.trim(),
          time: newStopTime.trim() || '07:30 AM',
          fee: Number(newStopFee) || prev.monthlyFee,
        },
      ],
    }));
    setNewStopName('');
  };

  const handleRemoveStopFromForm = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.vehicleNo.trim() || !formData.driverName.trim()) {
      showToast('Validation Error', 'Route Name, Vehicle Number, and Driver Name are required.', 'error');
      return;
    }

    if (editingRoute) {
      updateTransportRoute(editingRoute.id, {
        name: formData.name.trim(),
        routeName: formData.name.trim(),
        vehicleNo: formData.vehicleNo.trim(),
        vehicleNumber: formData.vehicleNo.trim(),
        driverName: formData.driverName.trim(),
        driverPhone: formData.driverPhone.trim(),
        capacity: Number(formData.capacity) || 35,
        monthlyFee: Number(formData.monthlyFee) || 60,
        status: formData.status,
        stops: formData.stops,
      });
    } else {
      addTransportRoute({
        name: formData.name.trim(),
        routeName: formData.name.trim(),
        startPoint: formData.stops[0]?.name || 'Origin',
        endPoint: formData.stops[formData.stops.length - 1]?.name || 'Destination',
        vehicleNo: formData.vehicleNo.trim(),
        vehicleNumber: formData.vehicleNo.trim(),
        driverName: formData.driverName.trim(),
        driverPhone: formData.driverPhone.trim(),
        capacity: Number(formData.capacity) || 35,
        totalStudents: 0,
        studentCount: 0,
        monthlyFee: Number(formData.monthlyFee) || 60,
        status: formData.status,
        stops: formData.stops,
      });
    }

    setIsRouteModalOpen(false);
  };

  const handleAssignStudent = () => {
    if (!studentToAssign) {
      showToast('Select Student', 'Please select a student to enroll onto this route.', 'error');
      return;
    }
    const rName = activeRoute.routeName || activeRoute.name;
    assignStudentToRoute(studentToAssign, rName);
    setStudentToAssign('');
    setIsAssignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet & School Transport Logistics"
        subtitle="Manage school buses, routes, drivers, pickup stops, and passenger manifests"
        badge={
          <Badge variant="primary">
            {transportRoutes.length} Configured Routes
          </Badge>
        }
        actions={
          <button
            type="button"
            onClick={handleOpenAddRoute}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Route</span>
          </button>
        }
      />

      {/* Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search route, bus number, or driver..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Route">On Route</option>
            <option value="Idle">Idle</option>
          </select>
        </div>
      </div>

      {/* Grid of Bus Fleet */}
      {filteredRoutes.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <Bus className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Transport Routes Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No routes match your current query.' : 'Click below to register your school buses and transport routes.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddRoute}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Bus Route</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRoutes.map((route) => {
            const isSelected = route.id === activeRoute?.id;
            const routeName = route.routeName || route.name;
            const currentStudents = students.filter((s) => s.transportRoute === routeName).length;
            const capacity = route.capacity || 40;
            const percent = Math.min(100, Math.round((currentStudents / capacity) * 100));

            return (
              <div
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      route.status === 'On Route'
                        ? 'success'
                        : route.status === 'Active'
                        ? 'primary'
                        : 'neutral'
                    }
                    size="sm"
                    dot
                  >
                    {route.status || 'Active'}
                  </Badge>
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    {route.vehicleNo || route.vehicleNumber || 'BUS'}
                  </span>
                </div>

                <h4 className="font-bold text-base text-slate-900 dark:text-white mt-3 truncate">
                  {routeName}
                </h4>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{route.driverName || 'Driver Unassigned'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{route.driverPhone || 'No contact phone'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Rs. {route.monthlyFee || 2500}/month</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Occupancy:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {currentStudents} / {capacity}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent >= 90 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Route Detail & Route Stops */}
      {activeRoute && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stops Timeline & Route Management Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {activeRoute.routeName || activeRoute.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Vehicle: {activeRoute.vehicleNo || activeRoute.vehicleNumber} • {activeRoute.driverName}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEditRoute(activeRoute)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  title="Edit Route"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingRoute(activeRoute)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                  title="Delete Route"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Scheduled Stops ({activeRoute.stops?.length || 0})
                </h4>
                <Badge variant="neutral" size="sm">Morning & Afternoon</Badge>
              </div>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900">
                {(activeRoute.stops || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No stops defined for this route.</p>
                ) : (
                  (activeRoute.stops || []).map((stop: any, i: number) => {
                    const stopName = typeof stop === 'string' ? stop : stop.name;
                    const stopTime =
                      typeof stop === 'object' && stop.time
                        ? stop.time
                        : i === 0
                        ? '06:45 AM'
                        : i === 1
                        ? '07:05 AM'
                        : '07:30 AM';
                    const stopFee =
                      typeof stop === 'object' && stop.fee ? stop.fee : activeRoute.monthlyFee;

                    return (
                      <div key={i} className="relative flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white dark:ring-slate-900 shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                              {stopName}
                            </h5>
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Scheduled: {stopTime}</span>
                            </p>
                          </div>
                        </div>
                        {stopFee && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                            Rs. {stopFee}/mo
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Monthly Fare:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                Rs. {activeRoute.monthlyFee || 2500} / student
              </span>
            </div>
          </div>

          {/* Passenger Roster */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Enrolled Bus Passengers</span>
                  <Badge variant="primary" size="sm">
                    {assignedStudents.length} Students
                  </Badge>
                </h3>
                <p className="text-xs text-slate-400">
                  Student boarding manifest, class, and emergency parent contacts
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Enroll Student</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {assignedStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs">No students currently assigned to this bus route.</p>
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-indigo-100"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Assign First Student</span>
                  </button>
                </div>
              ) : (
                assignedStudents.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between text-xs gap-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Class: {s.class}-{s.section} • Roll #{s.rollNumber || 'N/A'}
                        {(s.cnic || s.cnicOrBForm) ? ` • CNIC/B-Form: ${s.cnic || s.cnicOrBForm}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {s.parentName || s.fatherName || 'Parent'}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          {s.parentPhone || s.fatherPhone || 'No contact'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStudentFromRoute(s.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                        title="Remove from Route"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Route Modal */}
      <Modal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        title={editingRoute ? 'Edit Transport Route' : 'Add New Transport Route'}
        subtitle="Configure route name, vehicle specifications, driver contact, and pickup stops"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsRouteModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="route-form"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              {editingRoute ? 'Save Route Changes' : 'Create Route'}
            </button>
          </>
        }
      >
        <form id="route-form" onSubmit={handleSaveRoute} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Route Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Route 03 - West Suburb Express"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Plate / Bus Number *
              </label>
              <input
                type="text"
                required
                value={formData.vehicleNo}
                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                placeholder="e.g. BUS-204"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Driver Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="e.g. Michael Harris"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Driver Phone Contact
              </label>
              <input
                type="tel"
                value={formData.driverPhone}
                onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                placeholder="+1 (555) 987-6543"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Seating Capacity
              </label>
              <input
                type="number"
                min={1}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Fee (PKR)
              </label>
              <input
                type="number"
                min={0}
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Operational Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Active">Active</option>
                <option value="On Route">On Route (Morning/Afternoon in transit)</option>
                <option value="Idle">Idle (Parked)</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Stops Configuration */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Route Pickup Stops Sequence
            </label>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {formData.stops.map((stop, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {stop.name}
                    </span>
                    <span className="text-slate-400 text-[11px]">({stop.time})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 text-[11px]">Rs. {stop.fee}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStopFromForm(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Stop Inputs */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <input
                type="text"
                value={newStopName}
                onChange={(e) => setNewStopName(e.target.value)}
                placeholder="New stop name (e.g. Metro Station)"
                className="flex-1 w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
              <input
                type="text"
                value={newStopTime}
                onChange={(e) => setNewStopTime(e.target.value)}
                placeholder="07:30 AM"
                className="w-full sm:w-28 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
              <input
                type="number"
                value={newStopFee}
                onChange={(e) => setNewStopFee(Number(e.target.value))}
                placeholder="Fee Rs."
                className="w-full sm:w-20 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleAddStopToForm}
                className="w-full sm:w-auto px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
              >
                + Add Stop
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Assign Student Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Enroll Student on Route"
        subtitle={`Assign passenger to ${activeRoute?.routeName || activeRoute?.name}`}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignStudent}
              disabled={!studentToAssign}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Enrollment
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              placeholder="Search student by name or class..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />
          </div>

          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Select Student ({filteredUnassignedStudents.length} Available)
          </label>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {filteredUnassignedStudents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {assignSearch ? 'No matching students found.' : 'All students are currently assigned to this route or no students enrolled.'}
              </p>
            ) : (
              filteredUnassignedStudents.map((st) => {
                const isSelected = studentToAssign === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setStudentToAssign(st.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold">
                        {st.firstName} {st.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Class: {st.class}-{st.section} • Roll #{st.rollNumber}
                        {st.transportRoute ? ` (Currently on: ${st.transportRoute})` : ' (No Transport)'}
                      </p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Route Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingRoute)}
        onClose={() => setDeletingRoute(null)}
        onConfirm={() => {
          if (deletingRoute) {
            deleteTransportRoute(deletingRoute.id);
            setDeletingRoute(null);
          }
        }}
        title="Delete Transport Route"
        message={`Are you sure you want to delete ${deletingRoute?.routeName || deletingRoute?.name}? Any assigned students will be unassigned from this transport route.`}
        variant="danger"
      />
    </div>
  );
};
