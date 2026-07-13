import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Thermometer, 
  MessageSquare, 
  Route,
  Sparkles,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

const musicGenres = [
  { value: 'none', label: 'No Music', icon: '🔇' },
  { value: 'pop', label: 'Pop', icon: '🎵' },
  { value: 'rock', label: 'Rock', icon: '🎸' },
  { value: 'jazz', label: 'Jazz', icon: '🎷' },
  { value: 'classical', label: 'Classical', icon: '🎻' },
  { value: 'hip_hop', label: 'Hip Hop', icon: '🎤' },
  { value: 'country', label: 'Country', icon: '🤠' },
  { value: 'electronic', label: 'Electronic', icon: '🎧' }
];

const temperatures = [
  { value: 'cool', label: 'Cool', icon: '❄️', desc: '18-20°C' },
  { value: 'moderate', label: 'Moderate', icon: '🌡️', desc: '21-23°C' },
  { value: 'warm', label: 'Warm', icon: '🔥', desc: '24-26°C' }
];

const conversationLevels = [
  { value: 'quiet', label: 'Quiet Ride', icon: '🤫', desc: 'Minimal conversation' },
  { value: 'minimal', label: 'Minimal Chat', icon: '😌', desc: 'Brief exchanges only' },
  { value: 'friendly', label: 'Friendly', icon: '😊', desc: 'Happy to chat' }
];

const routePreferences = [
  { value: 'fastest', label: 'Fastest Route', icon: '⚡', desc: 'Get there ASAP' },
  { value: 'scenic', label: 'Scenic Route', icon: '🌄', desc: 'Enjoy the view' },
  { value: 'avoid_highways', label: 'Avoid Highways', icon: '🛣️', desc: 'Take local roads' }
];

export default function RidePreferencesCard({ preferences, onChange }) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key, value) => {
    onChange({
      ...preferences,
      [key]: value
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">Customize Your Ride</CardTitle>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {expanded ? 'Hide' : 'Show Options'}
            </button>
          </div>
          {!expanded && (
            <div className="flex items-center gap-2 mt-2">
              <Info className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-600">
                Tell your driver your preferences for a personalized experience
              </p>
            </div>
          )}
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            {/* Music Preference */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-600" />
                Music Preference
              </Label>
              <Select 
                value={preferences.music_genre || 'none'} 
                onValueChange={(value) => handleChange('music_genre', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {musicGenres.map((genre) => (
                    <SelectItem key={genre.value} value={genre.value}>
                      <span className="flex items-center gap-2">
                        <span>{genre.icon}</span>
                        <span>{genre.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-purple-600" />
                Temperature
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {temperatures.map((temp) => (
                  <button
                    key={temp.value}
                    onClick={() => handleChange('temperature', temp.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preferences.temperature === temp.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{temp.icon}</div>
                    <div className="text-xs font-medium">{temp.label}</div>
                    <div className="text-[10px] text-gray-500">{temp.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Level */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Conversation Level
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {conversationLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => handleChange('conversation_level', level.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preferences.conversation_level === level.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{level.icon}</div>
                    <div className="text-xs font-medium">{level.label}</div>
                    <div className="text-[10px] text-gray-500">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Route Preference */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Route className="w-4 h-4 text-purple-600" />
                Route Preference
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {routePreferences.map((route) => (
                  <button
                    key={route.value}
                    onClick={() => handleChange('route_preference', route.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preferences.route_preference === route.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{route.icon}</div>
                    <div className="text-xs font-medium">{route.label}</div>
                    <div className="text-[10px] text-gray-500">{route.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Special Requests */}
            <div className="space-y-2">
              <Label>Special Requests (Optional)</Label>
              <Textarea
                placeholder="Any other preferences? (e.g., 'Please help with luggage', 'Stop at coffee shop')"
                value={preferences.special_requests || ''}
                onChange={(e) => handleChange('special_requests', e.target.value)}
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500">
                {preferences.special_requests?.length || 0}/200 characters
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Your preferences will be shared with your driver to enhance your experience
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}