import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
  Drawer,
  InputAdornment,
  Chip,
  Divider,
  Tooltip,
  Skeleton,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from '../api';

const DRAWER_WIDTH = 420;

const AI_PROVIDERS = [
  { value: 'groq', label: 'Groq (Free/Fast)', model: 'Llama 3.3 70B' },
  {
    value: 'gemini',
    label: 'Google Gemini (Free Tier)',
    model: 'Gemini 2.0 Flash',
  },
  { value: 'openai', label: 'OpenAI (Paid)', model: 'GPT-4o mini' },
];

const API_KEY_LINKS = {
  groq: {
    href: 'https://console.groq.com/keys',
    label: 'Get Groq API Key (Free)',
  },
  gemini: {
    href: 'https://aistudio.google.com/app/apikey',
    label: 'Get Gemini API Key (Free)',
  },
  openai: {
    href: 'https://platform.openai.com/api-keys',
    label: 'Get OpenAI API Key',
  },
};

const CONTEXT_LABELS = {
  sleep: 'Sleep',
  workout: 'Workout',
  'workout stats': 'Workout Stats',
  'workout history': 'Workout History',
  measurements: 'Measurements',
};

// ─── Markdown renderer ────────────────────────────────────────────────────────

function MarkdownBlock({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];
  let key = 0;

  const renderInline = (str) =>
    str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

  const flushList = () => {
    if (!listBuffer.length) return;
    elements.push(
      <Box component="ul" key={key++} sx={{ mt: 0.5, mb: 1.5, pl: 2.5 }}>
        {listBuffer.map((item, i) => (
          <li key={i} style={{ marginBottom: 5 }}>
            <Typography
              variant="body2"
              component="span"
              sx={{ lineHeight: 1.65, color: 'text.primary' }}
              dangerouslySetInnerHTML={{ __html: renderInline(item) }}
            />
          </li>
        ))}
      </Box>
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    if (/^##+ /.test(line)) {
      flushList();
      const headText = line.replace(/^##+ /, '');
      elements.push(
        <Typography
          key={key++}
          variant="subtitle2"
          fontWeight="bold"
          sx={{ mt: i === 0 ? 0 : 2, mb: 0.75, color: 'secondary.main' }}
          dangerouslySetInnerHTML={{ __html: renderInline(headText) }}
        />
      );
    } else if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      listBuffer.push(line.replace(/^[-*] /, '').replace(/^\d+\. /, ''));
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <Typography
          key={key++}
          variant="body2"
          sx={{ mb: 0.75, lineHeight: 1.7, color: 'text.primary' }}
          dangerouslySetInnerHTML={{ __html: renderInline(line) }}
        />
      );
    }
  });
  flushList();

  return <>{elements}</>;
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────

function ChatMessage({ role, content }) {
  const isUser = role === 'user';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: '88%',
          px: 2,
          py: 1.5,
          borderRadius: 2,
          borderTopRightRadius: isUser ? 0 : 2,
          borderTopLeftRadius: isUser ? 2 : 0,
          bgcolor: isUser ? 'secondary.main' : 'action.selected',
        }}
      >
        {isUser ? (
          <Typography
            variant="body2"
            sx={{ color: 'secondary.contrastText', lineHeight: 1.6 }}
          >
            {content}
          </Typography>
        ) : (
          <MarkdownBlock text={content} />
        )}
      </Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AiInsights({ data, contextType }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [conversation, setConversation] = useState(null);

  const lastDataRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const [config, setConfig] = useState({
    provider: localStorage.getItem('ai_provider') || 'groq',
    apiKey: localStorage.getItem('ai_api_key') || '',
    userGoal:
      localStorage.getItem('ai_user_goal') || 'General health optimization',
  });

  const saveSettings = () => {
    localStorage.setItem('ai_provider', config.provider);
    localStorage.setItem('ai_api_key', config.apiKey);
    localStorage.setItem('ai_user_goal', config.userGoal);
    setSettingsOpen(false);
  };

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, open]);

  const dataFingerprint = JSON.stringify(data)?.slice(0, 200);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setConversation(null);

    try {
      const response = await axios.post('/api/ai/analyze', {
        provider: config.provider,
        apiKey: config.apiKey,
        userGoal: config.userGoal,
        data,
        contextType,
      });

      lastDataRef.current = dataFingerprint;
      setConversation([
        {
          role: 'user',
          content: `Analyze my ${CONTEXT_LABELS[contextType] || contextType} data. My goal: ${config.userGoal}.`,
          hidden: true,
        },
        { role: 'assistant', content: response.data.insights },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          'Analysis failed. Check your API key.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!config.apiKey) {
      setSettingsOpen(true);
      return;
    }
    if (!conversation || lastDataRef.current !== dataFingerprint) {
      runAnalysis();
    }
  };

  const sendFollowUp = async () => {
    const question = chatInput.trim();
    if (!question || chatLoading) return;

    setChatInput('');
    setChatLoading(true);

    const updated = [...conversation, { role: 'user', content: question }];
    setConversation(updated);

    try {
      const response = await axios.post('/api/ai/chat', {
        provider: config.provider,
        apiKey: config.apiKey,
        userGoal: config.userGoal,
        contextType,
        messages: updated.filter((m) => !m.hidden),
      });

      setConversation([
        ...updated,
        { role: 'assistant', content: response.data.reply },
      ]);
    } catch (err) {
      setConversation([
        ...updated,
        {
          role: 'assistant',
          content: '⚠️ ' + (err.response?.data?.detail || 'Failed to respond.'),
        },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendFollowUp();
    }
  };

  const visibleMessages = conversation?.filter((m) => !m.hidden) || [];
  const contextLabel = CONTEXT_LABELS[contextType] || contextType;
  const currentProvider = AI_PROVIDERS.find((p) => p.value === config.provider);

  return (
    <>
      {/* ── Inline trigger — renders where <AiInsights> sits, takes minimal space ── */}
      <Tooltip title={`AI ${contextLabel} Analysis`} placement="top">
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          startIcon={<AutoAwesomeIcon sx={{ fontSize: '0.9rem !important' }} />}
          onClick={handleOpen}
          sx={{
            borderRadius: 5,
            px: 1.5,
            py: 0.4,
            fontSize: '0.72rem',
            textTransform: 'none',
            borderStyle: 'dashed',
            opacity: 0.7,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1, borderStyle: 'solid' },
          }}
        >
          AI Insights
        </Button>
      </Tooltip>

      {/* ── Right-side drawer — uses MUI portal, floats over all content ── */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: DRAWER_WIDTH },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <AutoAwesomeIcon color="secondary" fontSize="small" />
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ flexGrow: 1 }}
          >
            AI Coach
          </Typography>
          <Chip
            label={contextLabel}
            size="small"
            color="secondary"
            variant="outlined"
          />
          <Tooltip title="Re-analyze">
            <span>
              <IconButton
                size="small"
                onClick={runAnalysis}
                disabled={loading || !config.apiKey}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton size="small" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Model + goal subheader */}
        {currentProvider && (
          <Box sx={{ px: 2, pt: 0.75, pb: 0.25, flexShrink: 0 }}>
            <Typography variant="caption" color="text.disabled" noWrap>
              {currentProvider.model} · {config.userGoal}
            </Typography>
          </Box>
        )}

        {/* Scrollable message area */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Loading skeletons */}
          {loading && (
            <Box>
              {[60, 80, 55, 95, 70].map((w, i) => (
                <Skeleton
                  key={i}
                  variant="text"
                  width={`${w}%`}
                  height={i % 2 === 0 ? 20 : 16}
                  sx={{ mb: 0.5 }}
                />
              ))}
              <Skeleton
                variant="rectangular"
                height={72}
                sx={{ my: 1.5, borderRadius: 1 }}
              />
              {[65, 85, 50].map((w, i) => (
                <Skeleton
                  key={i}
                  variant="text"
                  width={`${w}%`}
                  height={i % 2 === 0 ? 20 : 16}
                  sx={{ mb: 0.5 }}
                />
              ))}
              <Skeleton
                variant="rectangular"
                height={88}
                sx={{ my: 1.5, borderRadius: 1 }}
              />
            </Box>
          )}

          {/* Empty / no API key state */}
          {!loading && !conversation && !error && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 8,
                gap: 2,
                opacity: 0.55,
                textAlign: 'center',
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 44 }} color="secondary" />
              <Typography variant="body2" color="text.secondary">
                Add an API key to get personalized insights
              </Typography>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => setSettingsOpen(true)}
              >
                Open Settings
              </Button>
            </Box>
          )}

          {/* Conversation */}
          {!loading &&
            visibleMessages.map((msg, i) => (
              <React.Fragment key={i}>
                {/* Divider between initial analysis and follow-ups */}
                {i === 1 && visibleMessages.length > 2 && (
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="caption" color="text.disabled">
                      Follow-up
                    </Typography>
                  </Divider>
                )}
                <ChatMessage role={msg.role} content={msg.content} />
              </React.Fragment>
            ))}

          {/* Typing indicator */}
          {chatLoading && (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                ml: 1,
                mb: 2,
              }}
            >
              <CircularProgress size={13} color="secondary" />
              <Typography variant="caption" color="text.secondary">
                Thinking…
              </Typography>
            </Box>
          )}

          <div ref={chatEndRef} />
        </Box>

        {/* Sticky chat input */}
        {conversation && !loading && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              size="small"
              placeholder="Ask a follow-up… (Enter to send)"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={chatLoading}
              multiline
              maxRows={4}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={sendFollowUp}
                      disabled={!chatInput.trim() || chatLoading}
                      color="secondary"
                    >
                      {chatLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SendIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
      </Drawer>

      {/* ── Settings dialog ── */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>AI Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure your AI provider and personal goal. Stored locally in your
            browser.
          </Typography>
          <TextField
            fullWidth
            label="Personal Goal"
            value={config.userGoal}
            onChange={(e) => setConfig({ ...config, userGoal: e.target.value })}
            placeholder="e.g. Lose 5kg, Improve HRV, Train for a marathon"
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            select
            fullWidth
            label="Provider"
            value={config.provider}
            onChange={(e) => setConfig({ ...config, provider: e.target.value })}
            sx={{ mb: 2 }}
          >
            {AI_PROVIDERS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label} — {opt.model}
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
          {API_KEY_LINKS[config.provider] && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              <a
                href={API_KEY_LINKS[config.provider].href}
                target="_blank"
                rel="noreferrer"
              >
                {API_KEY_LINKS[config.provider].label}
              </a>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button
            onClick={saveSettings}
            variant="contained"
            disabled={!config.apiKey}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
