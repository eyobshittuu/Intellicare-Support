import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import { userService } from '../services/userService';
import { 
  ArrowLeft, Calendar, User, Building2, Tag, Clock, Loader2, 
  Save, FileText, CheckCircle, ClipboardList, Stethoscope, Play, Check, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import FileViewer from '../components/FileViewer';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [updating, setUpdating] = useState(false);
  const [workLog, setWorkLog] = useState({
    admin_notes: '',
    diagnosis: '',
    actions_taken: '',
    resolution_steps: '',
    status: '',
    priority: ''
  });
  const [summary, setSummary] = useState('');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [viewingFile, setViewingFile] = useState(null);

  const difficultyLabels = {
    1: { label: 'Very Easy', desc: 'Basic inquiries, simple issues', color: 'text-green-600' },
    2: { label: 'Easy', desc: 'Common issues with known solutions', color: 'text-blue-600' },
    3: { label: 'Medium', desc: 'Requires investigation', color: 'text-yellow-600' },
    4: { label: 'Hard', desc: 'Complex issues, multiple systems', color: 'text-orange-600' },
    5: { label: 'Very Hard', desc: 'Critical, unique, requires expertise', color: 'text-red-600' }
  };

  useEffect(() => {
    fetchTicket();
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [id, isSuperAdmin]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTicket(id);
      console.log('Ticket data received:', data);
      console.log('Attachments:', data.attachments);
      setTicket(data);
      setWorkLog({
        admin_notes: data.admin_notes || '',
        diagnosis: data.diagnosis || '',
        actions_taken: data.actions_taken || '',
        resolution_steps: data.resolution_steps || '',
        status: data.status,
        priority: data.priority
      });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load ticket');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const data = await userService.getUsers({ role: 'admin' });
      setAdmins(data.users || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedAdmin) {
      toast.error('Please select an admin');
      return;
    }

    try {
      setUpdating(true);
      await ticketService.assignTicket(id, selectedAdmin, difficulty);
      toast.success('Ticket assigned successfully');
      setShowAssignModal(false);
      setSelectedAdmin('');
      setDifficulty(3);
      fetchTicket();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    } finally {
      setUpdating(false);
    }
  };

  const handleWorkLogChange = (e) => {
    const { name, value } = e.target;
    setWorkLog(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveWorkLog = async () => {
    try {
      setUpdating(true);
      await ticketService.updateTicket(id, workLog);
      toast.success('Work log saved successfully');
      fetchTicket();
    } catch (error) {
      console.error('Error saving work log:', error);
      toast.error('Failed to save work log');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartWorking = async () => {
    try {
      setUpdating(true);
      await ticketService.updateTicket(id, { 
        status: 'in_progress',
        assigned_to: user.id 
      });
      toast.success('Started working on ticket');
      fetchTicket();
      setActiveTab('worklog');
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error('Failed to start working');
    } finally {
      setUpdating(false);
    }
  };

  const handleFinalize = async () => {
    if (!summary || summary.trim() === '') {
      toast.error('Please provide a summary to finalize the ticket');
      return;
    }

    try {
      setUpdating(true);
      await ticketService.finalizeTicket(id, summary);
      toast.success('Ticket finalized successfully');
      setShowFinalizeModal(false);
      setSummary('');
      fetchTicket();
    } catch (error) {
      console.error('Error finalizing ticket:', error);
      toast.error('Failed to finalize ticket');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      in_progress: 'bg-teal-100 text-teal-800 border-teal-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 border-gray-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket not found</p>
        <Link to="/tickets" className="text-teal-600 hover:text-teal-700 mt-4 inline-block">
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/tickets"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {ticket.ticket_number}
            </h1>
            <p className="text-gray-600 mt-1">{ticket.title}</p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex gap-3">
            {/* Super Admin: Assign Button */}
            {isSuperAdmin && !ticket.assigned_to && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <UserPlus size={18} />
                Assign to Admin
              </button>
            )}
            
            {ticket.status === 'pending' && (
              <button
                onClick={handleStartWorking}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                <Play size={18} />
                Start Working
              </button>
            )}
            {(ticket.status === 'in_progress' || ticket.status === 'completed') && !ticket.finalized_at && (
              <button
                onClick={() => setShowFinalizeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check size={18} />
                Finalize Ticket
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          {isAdmin && (
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'details'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="inline mr-2" size={18} />
                    Ticket Details
                  </button>
                  <button
                    onClick={() => setActiveTab('worklog')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'worklog'
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <ClipboardList className="inline mr-2" size={18} />
                    Admin Work Log
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Ticket Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Attachments ({ticket.attachments.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ticket.attachments.map((attachment, index) => {
                      // Determine if it's an image based on URL or originalName
                      const fileName = attachment.originalName || attachment.url || '';
                      const extension = fileName.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
                      
                      // Get file icon and color for non-images
                      const getFileIcon = (ext) => {
                        if (ext === 'pdf') return { icon: '📄', color: 'bg-red-100 text-red-800', label: 'PDF' };
                        if (['doc', 'docx'].includes(ext)) return { icon: '📝', color: 'bg-blue-100 text-blue-800', label: 'Word' };
                        if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: '📊', color: 'bg-green-100 text-green-800', label: 'Excel' };
                        if (ext === 'txt') return { icon: '📃', color: 'bg-gray-100 text-gray-800', label: 'Text' };
                        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: '🗜️', color: 'bg-purple-100 text-purple-800', label: 'Archive' };
                        return { icon: '📎', color: 'bg-gray-100 text-gray-800', label: 'File' };
                      };
                      
                      const fileInfo = getFileIcon(extension);
                      
                      return (
                        <div key={index} className="relative group">
                          {isImage ? (
                            // Image preview
                            <div 
                              className="w-full h-48 rounded-lg border border-gray-200 cursor-pointer hover:border-teal-500 transition-colors overflow-hidden"
                              onClick={() => setViewingFile(attachment)}
                            >
                              <img
                                src={attachment.url}
                                alt={attachment.originalName || `Attachment ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Image failed to load:', attachment.url);
                                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">Image Error</div>';
                                }}
                              />
                            </div>
                          ) : (
                            // File icon display
                            <div 
                              className="w-full h-48 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:border-teal-500 hover:bg-gray-100 transition-colors"
                              onClick={() => setViewingFile(attachment)}
                            >
                              <span className="text-5xl mb-3">{fileInfo.icon}</span>
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${fileInfo.color} mb-2`}>
                                {extension.toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-600 px-3 text-center">
                                {fileInfo.label}
                              </span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="truncate font-medium">{attachment.originalName || 'Unknown'}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span>{attachment.size ? (attachment.size / 1024).toFixed(1) + ' KB' : 'N/A'}</span>
                              <span className="text-teal-300">Click to view</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Work Log Tab */}
          {activeTab === 'worklog' && isAdmin && (
            <div className="space-y-6">
              {/* Admin Notes */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-teal-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Admin Notes</h3>
                  <span className="text-xs text-gray-500">(Internal only)</span>
                  {ticket.finalized_at && (
                    <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Finalized - Read Only
                    </span>
                  )}
                </div>
                <textarea
                  name="admin_notes"
                  value={workLog.admin_notes}
                  onChange={handleWorkLogChange}
                  disabled={!!ticket.finalized_at}
                  rows="4"
                  placeholder="Internal notes about the ticket, customer communication, or special considerations..."
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    ticket.finalized_at ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Diagnosis */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Stethoscope className="text-blue-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Problem Diagnosis</h3>
                </div>
                <textarea
                  name="diagnosis"
                  value={workLog.diagnosis}
                  onChange={handleWorkLogChange}
                  disabled={!!ticket.finalized_at}
                  rows="4"
                  placeholder="What is the root cause of the issue? What did you find during investigation?..."
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    ticket.finalized_at ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Actions Taken */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="text-orange-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Actions Taken</h3>
                </div>
                <textarea
                  name="actions_taken"
                  value={workLog.actions_taken}
                  onChange={handleWorkLogChange}
                  disabled={!!ticket.finalized_at}
                  rows="5"
                  placeholder="What did you do to resolve this issue? List all actions taken, configurations changed, etc..."
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    ticket.finalized_at ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Resolution Steps */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="text-green-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Resolution Steps</h3>
                </div>
                <textarea
                  name="resolution_steps"
                  value={workLog.resolution_steps}
                  onChange={handleWorkLogChange}
                  disabled={!!ticket.finalized_at}
                  rows="5"
                  placeholder="Step-by-step process to resolve this issue. This will help with similar issues in the future..."
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    ticket.finalized_at ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Status & Priority */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={workLog.status}
                      onChange={handleWorkLogChange}
                      disabled={!!ticket.finalized_at}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        ticket.finalized_at ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={workLog.priority}
                      onChange={handleWorkLogChange}
                      disabled={!!ticket.finalized_at}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        ticket.finalized_at ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Save Button - Hide when finalized */}
              {!ticket.finalized_at && (
                <button
                  onClick={handleSaveWorkLog}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save Work Log
                    </>
                  )}
                </button>
              )}

              {/* Finalized Notice */}
              {ticket.finalized_at && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle size={20} />
                    <p className="text-sm font-medium">
                      This ticket has been finalized. Work log is now read-only and cannot be edited.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Finalized Summary Display */}
          {ticket.finalized_at && ticket.summary && (
            <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="text-white" size={16} />
                </div>
                <h2 className="text-lg font-semibold text-green-900">Ticket Finalized</h2>
              </div>
              <p className="text-sm text-green-800 whitespace-pre-wrap">{ticket.summary}</p>
              {ticket.finalizer && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-xs text-green-700">
                    Finalized by <span className="font-medium">{ticket.finalizer.first_name} {ticket.finalizer.last_name}</span>
                    {' '}on {formatDate(ticket.finalized_at)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Ticket Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Priority</p>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Hospital</p>
                  <p className="text-sm font-medium text-gray-900">{ticket.hospital}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-sm font-medium text-gray-900">{ticket.category || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Created By</p>
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.user 
                      ? `${ticket.user.first_name} ${ticket.user.last_name}` 
                      : 'Deleted User'}
                  </p>
                  {ticket.user && (
                    <p className="text-xs text-gray-500">{ticket.user.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(ticket.created_at)}
                  </p>
                </div>
              </div>

              {ticket.started_at && (
                <div className="flex items-start gap-3">
                  <Clock className="text-gray-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Started Working</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(ticket.started_at)}
                    </p>
                  </div>
                </div>
              )}

              {ticket.resolved_at && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-gray-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Resolved</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(ticket.resolved_at)}
                    </p>
                  </div>
                </div>
              )}

              {ticket.assignee && (
                <div className="flex items-start gap-3">
                  <User className="text-gray-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="text-sm font-medium text-gray-900">
                      {ticket.assignee.first_name} {ticket.assignee.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{ticket.assignee.email}</p>
                  </div>
                </div>
              )}

              {ticket.difficulty && (
                <div className="flex items-start gap-3">
                  <Tag className="text-gray-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Difficulty</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${difficultyLabels[ticket.difficulty]?.color || 'text-gray-900'}`}>
                        {ticket.difficulty}/5
                      </span>
                      <span className="text-xs text-gray-600">
                        ({difficultyLabels[ticket.difficulty]?.label || 'N/A'})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {ticket.assigned_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="text-gray-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Assigned At</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(ticket.assigned_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Finalize Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Finalize Ticket</h2>
            <p className="text-sm text-gray-600 mb-4">
              Provide a summary to finalize this ticket. This will mark it as completed.
            </p>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows="6"
              placeholder="Write a comprehensive summary of the issue and resolution..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleFinalize}
                disabled={updating || !summary.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Finalize Ticket
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowFinalizeModal(false);
                  setSummary('');
                }}
                disabled={updating}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Assign Ticket to Admin</h2>
            <p className="text-sm text-gray-600 mb-6">
              Select an admin and set the difficulty level for this ticket.
            </p>
            
            {/* Admin Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Admin <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">-- Choose an admin --</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.first_name} {admin.last_name} - {admin.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Difficulty Level <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <label
                    key={level}
                    className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      difficulty === level
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={level}
                      checked={difficulty === level}
                      onChange={(e) => setDifficulty(Number(e.target.value))}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${difficultyLabels[level].color}`}>
                          {level}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {difficultyLabels[level].label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {difficultyLabels[level].desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAssignTicket}
                disabled={updating || !selectedAdmin}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Assign Ticket
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAdmin('');
                  setDifficulty(3);
                }}
                disabled={updating}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer
          file={viewingFile}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
};

export default TicketDetail;
