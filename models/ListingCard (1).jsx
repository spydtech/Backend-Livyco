import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import React from "react";
import Pgimg from "../../assets/user/pgsearch/Pgimg.png";
import image5 from "../../assets/user/pgsearch/images/image5.png";
import image6 from "../../assets/user/pgsearch/images/image6.png";
import image7 from "../../assets/user/pgsearch/images/image7.png";
import image8 from "../../assets/user/pgsearch/images/image8.png";
import image9 from "../../assets/user/pgsearch/images/image9.png";
import image10 from "../../assets/user/pgsearch/images/image10.png";
import image11 from "../../assets/user/pgsearch/images/image11.png";
import image12 from "../../assets/user/pgsearch/images/image12.png";
import { FiShare2 as Share2, FiHeart as HeartOutline } from 'react-icons/fi';
import { FaHeart as HeartSolid } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const normalize = (str) => str.toLowerCase().replace(/[\s.-]/g, "");

const imageMap = {
  wifi: image5,
  commonkitchen: image6,
  security: image7,
  dailycleaning: image8,
  smoking: image9,
  alcohol: image10,
  tv: image11,
  refrigerator: image12,
};

export default function ListingCard({ pg }) {
  const navigate = useNavigate();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState(pg); // Use passed prop or fetched data
  
  const propertyId = pg._id || pg.id;
  
  const getCurrentUserId = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.userId || user._id || user.id || user.clientId;
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
    return null;
  };

  // GET method to fetch property details
  const fetchPropertyDetails = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/properties/${id}`);
      if (response.data.success) {
        setPropertyDetails(response.data.property);
        return response.data.property;
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  // Optionally fetch property details if not all data is passed in the prop
  useEffect(() => {
    // Only fetch if we have an ID but incomplete data
    if (propertyId && (!pg.name || !pg.amenities)) {
      fetchPropertyDetails(propertyId);
    }
  }, [propertyId]);

  // Trigger wishlist update event
  const triggerWishlistUpdate = () => {
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
  };

  useEffect(() => {
    const checkWishlistStatus = async () => {
      const userId = getCurrentUserId();
      if (!userId || !propertyId) return;

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/wishlist/check/${userId}/${propertyId}`
        );
        if (response.data.success) {
          setIsInWishlist(response.data.isInWishlist);
        }
      } catch (error) {
        setIsInWishlist(false);
      }
    };

    checkWishlistStatus();
  }, [propertyId]);

  const handleCardClick = () => {
    navigate(`/user/view-pg/${propertyId}`, { state: { pg: propertyDetails } });
  };

  const handleShare = (e) => {
    e.stopPropagation();
    navigate(`/share/${propertyId}`);
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const userId = getCurrentUserId();
    if (!userId) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    if (!propertyId) {
      toast.error('Property information is missing');
      return;
    }

    setLoading(true);
    
    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await axios.delete(
          `${API_BASE_URL}/api/wishlist/remove/${userId}/${propertyId}`
        );
        
        if (response.data.success) {
          setIsInWishlist(false);
          triggerWishlistUpdate(); // Trigger update event
          toast.success('Removed from wishlist');
        }
      } else {
        // Add to wishlist
        const response = await axios.post(
          `${API_BASE_URL}/api/wishlist/add`,
          { userId, propertyId }
        );
        
        if (response.data.success) {
          setIsInWishlist(true);
          triggerWishlistUpdate(); // Trigger update event
          toast.success('Added to wishlist');
        } else if (response.data.message === 'Property already in wishlist') {
          setIsInWishlist(true);
          toast.info('Already in wishlist');
        }
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('already in wishlist')) {
        setIsInWishlist(true);
        toast.info('Already in wishlist');
      } else {
        toast.error('Error updating wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  // Use propertyDetails instead of pg for rendering
  const displayData = propertyDetails || pg;

  return (
    <div className="relative flex bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg w-full transition">
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={handleShare}
          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
        >
          <Share2 className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={handleWishlist}
          disabled={loading}
          className={`bg-white p-2 rounded-full shadow hover:bg-gray-100 ${
            isInWishlist ? 'text-red-500' : 'text-gray-700'
          }`}
        >
          {loading ? (
            <div className="w-4 h-4 border-t-2 border-red-500 border-solid rounded-full animate-spin"></div>
          ) : isInWishlist ? (
            <HeartSolid className="w-4 h-4" />
          ) : (
            <HeartOutline className="w-4 h-4" />
          )}
        </button>
      </div>

      <div onClick={handleCardClick} className="cursor-pointer flex w-full">
        <div className="w-1/3 h-40 p-4">
          <img
            src={Pgimg}
            className="w-full h-full object-cover rounded-md"
            alt={displayData.name}
          />
        </div>

        <div className="w-2/3 p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold">{displayData.name}</h2>
            <p className="text-sm text-gray-600">{displayData.location}</p>
            <p className="text-red-600 font-bold mt-1">₹{displayData.price}/-</p>

            <div className="flex items-center text-yellow-500 text-sm mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>
                  {displayData.rating >= i + 1 ? "★" : "☆"}
                </span>
              ))}
              <span className="ml-2 text-gray-600 text-xs">
                ({displayData.rating} - {displayData.reviews} reviews)
              </span>
            </div>

            <div className="mt-2 text-xs flex flex-wrap gap-4">
              {displayData.amenities?.slice(0, 3).map((amenity, index) => {
                const key = normalize(amenity);
                const icon = imageMap[key];

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center text-center px-3 py-2 rounded"
                  >
                    <span className="text-[10px] text-gray-700 mb-1">
                      {amenity}
                    </span>
                    {icon ? (
                      <img
                        src={icon}
                        alt={amenity}
                        className="w-4 h-4 object-contain"
                      />
                    ) : (
                      <div className="w-4 h-4 bg-gray-300 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-right mt-2">
            <p className="text-sm text-blue-600 underline">View all</p>
          </div>
        </div>
      </div>
    </div>
  );
}