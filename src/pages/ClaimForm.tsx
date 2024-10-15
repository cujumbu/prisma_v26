import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ClaimFormData {
  orderNumber: string;
  email: string;
  name: string;
  address: string;
  phoneNumber: string;
  brand: string;
  problemDescription: string;
}

const ClaimForm: React.FC = () => {
  const [formData, setFormData] = useState<ClaimFormData>({
    orderNumber: '',
    email: '',
    name: '',
    address: '',
    phoneNumber: '',
    brand: '',
    problemDescription: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit claim');
      }
      navigate('/status', { state: { claimId: data.id } });
    } catch (error) {
      console.error('Error submitting claim:', error);
      setError(error.message || 'An error occurred while submitting the claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of the component remains the same
};

export default ClaimForm;
