import React from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close as CloseIcon, CheckCircle, Error, Warning, Info } from '@mui/icons-material';

interface NotificationProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  autoHideDuration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000,
}) => {
  const getSeverityIcon = () => {
    switch (severity) {
      case 'success':
        return <CheckCircle fontSize="inherit" />;
      case 'error':
        return <Error fontSize="inherit" />;
      case 'warning':
        return <Warning fontSize="inherit" />;
      case 'info':
        return <Info fontSize="inherit" />;
      default:
        return <Info fontSize="inherit" />;
    }
  };

  // Определяем стили для разных типов уведомлений
  const getSeverityStyles = () => {
    switch (severity) {
      case 'success':
        return {
          backgroundColor: '#4caf50', // Зеленый фон
          color: '#ffffff', // Белый текст
          '& .MuiAlert-icon': { color: '#ffffff' }, // Белая иконка
        };
      case 'error':
        return {
          backgroundColor: '#f44336', // Красный фон
          color: '#ffffff', // Белый текст
          '& .MuiAlert-icon': { color: '#ffffff' }, // Белая иконка
        };
      case 'warning':
        return {
          backgroundColor: '#ff9800', // Оранжевый фон
          color: '#000000', // Черный текст (для лучшей читаемости)
          '& .MuiAlert-icon': { color: '#000000' }, // Черная иконка
        };
      case 'info':
        return {
          backgroundColor: '#2196f3', // Синий фон
          color: '#ffffff', // Белый текст
          '& .MuiAlert-icon': { color: '#ffffff' }, // Белая иконка
        };
      default:
        return {
          backgroundColor: '#757575', // Серый фон
          color: '#ffffff', // Белый текст
          '& .MuiAlert-icon': { color: '#ffffff' }, // Белая иконка
        };
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        '& .MuiSnackbarContent-root': {
          '@media (max-width: 600px)': {
            width: '100%',
            maxWidth: 'calc(100vw - 32px)',
            margin: '16px',
            borderRadius: '8px',
          },
        },
      }}
    >
      <Alert
        severity={severity}
        onClose={onClose}
        icon={getSeverityIcon()}
        sx={{
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          // Применяем стили для конкретного типа уведомления
          ...getSeverityStyles(),
          '& .MuiAlert-icon': {
            fontSize: '24px',
            marginRight: '12px',
          },
          '& .MuiAlert-message': {
            fontSize: '14px',
            lineHeight: '1.5',
            padding: '4px 0',
            color: 'inherit', // Наследует цвет от родителя
          },
          '& .MuiAlert-action': {
            padding: '4px 0 0 0',
            marginRight: '-8px',
          },
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            onClick={onClose}
            sx={{
              padding: '4px',
              marginLeft: '8px',
              color: 'inherit',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;