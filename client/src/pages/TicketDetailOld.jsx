import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import { 
  ArrowLeft, Calendar, User, Building2, Tag, AlertCircle, Clock, Loader2, 
  Edit, Save, X, FileText, CheckCircle, ClipboardList, Stethoscope, Settings
} from 'lucide-react';
import { toast } from 'sonner';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
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

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTicket(id);
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
      toast.success('Work log updated successfully');
      fetchTicket();
    } catch (error) {
      console.error('Error updating work log:', error);
      toast.error('Failed to update work log');
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
      setFinalizing(false);
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

  const canEdit = isAdmin || ticket.user_id === user?.id;

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
        
        {isAdmin && !editing && !finalizing && (
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
            >
              <Edit size={18} />
              Edit Status
            </button>
            {!ticket.finalized_at && (
              <button
                onClick={() => setFinalizing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Save size={18} />
                Finalize Ticket
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Edit Form (Admin Only) */}
          {editing && isAdmin && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Ticket</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        status: ticket.status,
                        priority: ticket.priority,
                        assigned_to: ticket.assigned_to || ''
                      });
                    }}
                    disabled={updating}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Finalize Form (Admin Only) */}
          {finalizing && isAdmin && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Finalize Ticket</h2>
              <p className="text-sm text-gray-600 mb-4">
                Provide a summary to finalize this ticket. This will mark it as completed.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows="6"
                    placeholder="Describe the resolution, actions taken, and outcome..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
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
                        <Save size={18} />
                        Finalize Ticket
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setFinalizing(false);
                      setSummary('');
                    }}
                    disabled={updating}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Display Summary if Finalized */}
          {ticket.finalized_at && ticket.summary && (
            <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Save className="text-white" size={16} />
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
                    {ticket.user?.first_name} {ticket.user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{ticket.user?.email}</p>
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

              <div className="flex items-start gap-3">
                <Clock className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(ticket.updated_at)}
                  </p>
                </div>
              </div>

              {ticket.resolved_at && (
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-gray-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Resolved</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(ticket.resolved_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
