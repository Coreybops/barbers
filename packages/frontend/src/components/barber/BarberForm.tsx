import React, { useState, useEffect } from 'react';
import { Barber, CreateBarberData, UpdateBarberData, User, Service } from '../../types';
import { barberApi } from '../../services/barberApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { useToast } from '../../hooks/useToast';
import { 
  Upload, 
  X, 
  User as UserIcon, 
  Mail, 
  Phone,
  Calendar,
  DollarSign,
  Star,
  Image as ImageIcon,
  Plus,
  Trash2
} from 'lucide-react';

interface BarberFormProps {
  barber?: Barber | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const BarberForm: React.FC<BarberFormProps> = ({
  barber,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    userId: barber?.userId || '',
    barbershopId: barber?.barbershopId || '',
    bio: barber?.bio || '',
    experience: barber?.experience?.toString() || '',
    hireDate: barber?.hireDate ? new Date(barber.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    commissionRate: barber?.commissionRate ? (barber.commissionRate * 100).toString() : '50',
    hourlyRate: barber?.hourlyRate?.toString() || '',
    isAvailable: barber?.isAvailable ?? true,
    isActive: barber?.isActive ?? true
  });

  const [specialties, setSpecialties] = useState<string[]>(barber?.specialties || []);
  const [certifications, setCertifications] = useState<string[]>(barber?.certifications || []);
  const [languages, setLanguages] = useState<string[]>(barber?.languages || []);
  const [socialMedia, setSocialMedia] = useState<Record<string, string>>(barber?.socialMedia || {});
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    barber?.avatar ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${barber.avatar}` : null
  );
  
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>(
    barber?.portfolio?.map(url => `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`) || []
  );

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    // Fetch users with BARBER role for new barber creation
    // This would typically come from an API call
    // For now, we'll skip this as it would require additional API endpoints
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPortfolioFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPortfolioPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
    setPortfolioPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties(prev => [...prev, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    setSpecialties(prev => prev.filter((_, i) => i !== index));
  };

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications(prev => [...prev, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages(prev => [...prev, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    setLanguages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const baseData = {
        bio: formData.bio || undefined,
        specialties: specialties.length > 0 ? specialties : undefined,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        hireDate: formData.hireDate,
        commissionRate: parseFloat(formData.commissionRate) / 100,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        certifications: certifications.length > 0 ? certifications : undefined,
        languages: languages.length > 0 ? languages : undefined,
        socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
        isAvailable: formData.isAvailable,
        isActive: formData.isActive
      };

      if (barber) {
        // Update existing barber
        const updateData: UpdateBarberData = {
          ...baseData,
          avatar: avatarFile || undefined,
          portfolio: portfolioFiles.length > 0 ? portfolioFiles : undefined
        };
        
        await barberApi.updateBarber(barber.id, updateData);
      } else {
        // Create new barber
        const createData: CreateBarberData = {
          userId: formData.userId,
          barbershopId: formData.barbershopId,
          ...baseData,
          avatar: avatarFile || undefined,
          portfolio: portfolioFiles.length > 0 ? portfolioFiles : undefined
        };
        
        await barberApi.createBarber(createData);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving barber:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save barber',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <UserIcon className="inline w-4 h-4 mr-1" />
            User ID
          </label>
          <Input
            type="text"
            value={formData.userId}
            onChange={(e) => handleInputChange('userId', e.target.value)}
            disabled={!!barber}
            required={!barber}
            placeholder="Enter user ID"
          />
          {!barber && (
            <p className="text-xs text-gray-500 mt-1">
              User must have BARBER role
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Barbershop ID
          </label>
          <Input
            type="text"
            value={formData.barbershopId}
            onChange={(e) => handleInputChange('barbershopId', e.target.value)}
            disabled={!!barber}
            required={!barber}
            placeholder="Enter barbershop ID"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tell us about this barber..."
        />
      </div>

      {/* Experience and Hire Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Star className="inline w-4 h-4 mr-1" />
            Years of Experience
          </label>
          <Input
            type="number"
            min="0"
            max="50"
            value={formData.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            placeholder="Years of experience"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Hire Date
          </label>
          <Input
            type="date"
            value={formData.hireDate}
            onChange={(e) => handleInputChange('hireDate', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Commission and Hourly Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 mr-1" />
            Commission Rate (%)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.commissionRate}
            onChange={(e) => handleInputChange('commissionRate', e.target.value)}
            placeholder="50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 mr-1" />
            Hourly Rate ($)
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.hourlyRate}
            onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
            placeholder="25.00"
          />
        </div>
      </div>

      {/* Specialties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specialties
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            placeholder="Add specialty"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
          />
          <Button type="button" onClick={addSpecialty} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {specialties.map((specialty, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {specialty}
              <button
                type="button"
                onClick={() => removeSpecialty(index)}
                className="ml-2 hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certifications
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newCertification}
            onChange={(e) => setNewCertification(e.target.value)}
            placeholder="Add certification"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
          />
          <Button type="button" onClick={addCertification} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
            >
              {cert}
              <button
                type="button"
                onClick={() => removeCertification(index)}
                className="ml-2 hover:text-green-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="Add language"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
          />
          <Button type="button" onClick={addLanguage} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {languages.map((language, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
            >
              {language}
              <button
                type="button"
                onClick={() => removeLanguage(index)}
                className="ml-2 hover:text-purple-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Avatar Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <ImageIcon className="inline w-4 h-4 mr-1" />
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Photo
            </label>
          </div>
        </div>
      </div>

      {/* Portfolio Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <ImageIcon className="inline w-4 h-4 mr-1" />
          Portfolio Images
        </label>
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePortfolioChange}
            className="hidden"
            id="portfolio-upload"
          />
          <label
            htmlFor="portfolio-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mb-4"
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Portfolio Images
          </label>
        </div>
        
        {portfolioPreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {portfolioPreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removePortfolioImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Available for appointments</span>
          </label>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Active employee</span>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : barber ? 'Update Barber' : 'Create Barber'}
        </Button>
      </div>
    </form>
  );
};

export default BarberForm;