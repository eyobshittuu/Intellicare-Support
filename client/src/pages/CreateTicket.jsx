import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  'Technical Issue',
  'Training Request',
  'Other'
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

const CreateTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  });
  const [errors, setErrors] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Helper function to get file icon and color based on extension
  const getFileIcon = (extension) => {
    const ext = extension?.toLowerCase();
    
    // Document types
    if (ext === 'pdf') return { icon: '📄', color: 'bg-red-100 text-red-800' };
    if (['doc', 'docx'].includes(ext)) return { icon: '📝', color: 'bg-blue-100 text-blue-800' };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: '📊', color: 'bg-green-100 text-green-800' };
    if (ext === 'txt') return { icon: '📃', color: 'bg-gray-100 text-gray-800' };
    
    // Archive types
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: '🗜️', color: 'bg-purple-100 text-purple-800' };
    
    // Default
    return { icon: '📎', color: 'bg-gray-100 text-gray-800' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 5 files
    if (files.length + selectedImages.length > 5) {
      toast.error('You can upload maximum 5 files');
      return;
    }

    // Validate file sizes (10MB max per file)
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Each file must be less than 10MB');
      return;
    }

    // Validate file types
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip', 'rar', '7z', 'tar', 'gz'];
    const invalidTypes = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return !allowedExtensions.includes(ext);
    });
    if (invalidTypes.length > 0) {
      toast.error('File type not supported. Allowed: Images, PDF, Word, Excel, CSV, TXT, ZIP, RAR, 7Z');
      return;
    }

    // Add files
    setSelectedImages(prev => [...prev, ...files]);

    // Create previews (only for images, icons for others)
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, { type: 'image', url: reader.result, name: file.name, size: file.size }]);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, store file info for icon display
        setImagePreviews(prev => [...prev, { 
          type: 'file', 
          name: file.name, 
          size: file.size,
          extension: file.name.split('.').pop().toLowerCase()
        }]);
      }
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Check if user has hospital assigned
    if (!user?.hospital) {
      toast.error('Your hospital has not been assigned yet. Please contact an administrator.');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Create FormData to handle file uploads
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('hospital', user.hospital); // Use user's assigned hospital
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);

      // Append images
      selectedImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const response = await ticketService.createTicket(formDataToSend);
      toast.success('Ticket created successfully!');
      navigate('/tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Ticket</h1>
        <p className="text-gray-600 mt-1">Submit a new support request</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief summary of your issue"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Hospital - Display Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hospital/Location
            </label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
              {user?.hospital || (
                <span className="text-red-500 italic">
                  No hospital assigned. Please contact an administrator.
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your hospital is assigned by the administrator during account approval
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please provide detailed information about your issue..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Optional)
            </label>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">Images, PDF, Word, Excel, ZIP, RAR (Max 10MB each, up to 5 files)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.7z,.tar,.gz"
                    multiple
                    onChange={handleImageChange}
                    disabled={selectedImages.length >= 5}
                  />
                </label>
              </div>

              {/* File Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      {preview.type === 'image' ? (
                        // Image preview
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                      ) : (
                        // File icon for non-images
                        <div className="w-full h-32 flex flex-col items-center justify-center rounded-lg border border-gray-300 bg-gray-50">
                          <span className="text-4xl mb-2">{getFileIcon(preview.extension).icon}</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getFileIcon(preview.extension).color}`}>
                            {preview.extension?.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-600 mt-1 px-2 text-center truncate w-full">
                            {preview.name.length > 20 ? preview.name.substring(0, 20) + '...' : preview.name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {(preview.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedImages.length > 0 && (
                <p className="text-sm text-gray-600">
                  {selectedImages.length} file{selectedImages.length > 1 ? 's' : ''} selected
                  {selectedImages.length < 5 && ' (You can add more)'}
                </p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Ticket...
                </>
              ) : (
                'Create Ticket'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
