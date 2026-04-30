import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Paper,
  Alert,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';
import axios from '../api';

const AI_PROVIDERS = [
  { value: 'groq', label: 'Groq (Free/Fast)', model: 'Llama 3.1 70B' },
  { value: 'gemini', label: 'Google Gemini (Free Tier)', model: 'Gemini 1.5 Flash' },
  { value: 'openai', label: 'OpenAI (Paid)', model: 'GPT-4o mini' },
];

export default function AiInsights({ data, contextType }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [config, setConfig] = useState({
    provider: localStorage.getItem('ai_provider') || 'groq',
    apiKey: localStorage.getItem('ai_api_key') || '',
  });

  const saveSettings = () => {
    localStorage.setItem('ai_provider', config.provider);
    localStorage.setItem('ai_api_key', config.apiKey);
    setSettingsOpen(false);
  };

  const getInsights = async () => {
    if (!config.apiKey) {
      setSettingsOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/ai/analyze', {
        provider: config.provider,
        apiKey: config.apiKey,
        data,
        contextType,
      });
      setInsights(response.data.insights);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          onClick={getInsights}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Get AI Insights'}
        </Button>
        <IconButton size="small" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {insights && (
        <Paper sx={{ p: 2, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: 'secondary.main' }}>
          <Typography variant="subtitle2" color="secondary" gutterBottom fontWeight="bold">
            AI Analysis
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {insights}
          </Typography>
        </Paper>
      )}

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>AI Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure your preferred AI provider. Your API key is stored locally in your browser.
          </Typography>
          <TextField
            select
            fullWidth
            label="Provider"
            value={config.provider}
            onChange={(e) => setConfig({ ...config, provider: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          >
            {AI_PROVIDERS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label} ({opt.model})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="API Key"
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="Paste your API key here"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {config.provider === 'groq' && (
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Get Groq API Key (Free)</a>
            )}
            {config.provider === 'gemini' && (
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Get Gemini API Key (Free Tier)</a>
            )}
            {config.provider === 'openai' && (
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Get OpenAI API Key</a>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button onClick={saveSettings} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
