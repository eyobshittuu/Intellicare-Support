import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const HOSPITALS = [
  'Hallelujah General Hospital',
  'Negele Arsi General Hospital',
  'Zway General Hospital',
  'Silk Road General Hospital',
  'Soddo General Hospital',
  'Axon Neurology Specialty Center',
  'Bethesda American Medical Plaza',
  'St. Urael Internal Medicine Specialty Clinic',
  'Bishoftu General Hospital',
  'British Hospital',
  'Wollo Medium Clinic',
  'Wellspring Multispecialty Medical Center',
  'Lobe Medium Clinic',
  'Butajira General Hospital',
  'Nile — Sululta General Hospital',
  'Oasis General Hospital',
  'Pinnacle Medium Clinic',
  'Michael Medium Clinic',
  'Alia Diagnostic Center',
  'Ethiotebib General Hospital',
  'Vital Medium Clinic',
  'Lukas Medium Clinic',
  'Liyu Medium Clinic',
  'Summit General Hospital',
  'Abnet General Hospital',
  'Gara Medium Clinic',
  'Eftu General Hospital',
  'Bethel General Hospital',
  'Ethiocare General Hospital',
  'Newleaf General Hospital',
  'Mosaic General Hospital'
];

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hospital: '',
    category: '',
    priority: 'medium'
  });
  const [errors, setErrors] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

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
    
    // Limit to 5 images
    if (files.length + selectedImages.length > 5) {
      toast.error('You can upload maximum 5 images');
      return;
    }

    // Validate file sizes (5MB max per file)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Each image must be less than 5MB');
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidTypes = files.filter(file => !validTypes.includes(file.type));
    if (invalidTypes.length > 0) {
      toast.error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
      return;
    }

    // Add files
    setSelectedImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
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

    if (!formData.hospital) {
      newErrors.hospital = 'Please select your hospital';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
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
      formDataToSend.append('hospital', formData.hospital);
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

          {/* Hospital */}
          <div>
            <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-2">
              Hospital/Location <span className="text-red-500">*</span>
            </label>
            <select
              id="hospital"
              name="hospital"
              value={formData.hospital}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                errors.hospital ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select your hospital</option>
              {HOSPITALS.map((hospital) => (
                <option key={hospital} value={hospital}>
                  {hospital}
                </option>
              ))}
            </select>
            {errors.hospital && (
              <p className="mt-1 text-sm text-red-600">{errors.hospital}</p>
            )}
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

          {/* Image Upload */}
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
                    <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP (Max 5MB each, up to 5 images)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={selectedImages.length >= 5}
                  />
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
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
                        {(selectedImages[index].size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedImages.length > 0 && (
                <p className="text-sm text-gray-600">
                  {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
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
