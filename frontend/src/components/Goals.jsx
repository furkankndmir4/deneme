import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Chip,
} from "@mui/material";

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [availableGoals, setAvailableGoals] = useState({});
  const [openDialog, setOpenDialog] = useState(false);

  // Hedefleri getir
  const fetchGoals = async () => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get("/api/goals", config);
      setGoals(response.data);
    } catch (error) {
      console.error("Hedefler alınamadı:", error);
    }
  };

  // Kullanılabilir hedefleri getir
  const fetchAvailableGoals = async () => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get("/api/goals/available", config);
      setAvailableGoals(response.data);
    } catch (error) {
      console.error("Kullanılabilir hedefler alınamadı:", error);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchAvailableGoals();
  }, []);

  // Hedef oluştur
  const createGoal = async (type, goalIndex) => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post("/api/goals", { type, goalIndex }, config);
      setOpenDialog(false);
      fetchGoals();
      fetchAvailableGoals();
    } catch (error) {
      console.error("Hedef oluşturulamadı:", error);
    }
  };

  // Hedef ilerleme yüzdesini hesapla
  const calculateProgress = (goal) => {
    if (goal.isCompleted) return 100;
    return (goal.currentValue / goal.targetValue) * 100;
  };

  // Hedef tipine göre renk belirle
  const getGoalTypeColor = (type) => {
    const colors = {
      weight: "primary",
      workout_streak: "success",
      distance: "info",
      strength: "warning",
    };
    return colors[type] || "default";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h2">
          Hedeflerim
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
        >
          Yeni Hedef Ekle
        </Button>
      </Box>

      <Grid container spacing={3}>
        {goals.map((goal) => (
          <Grid item xs={12} md={6} key={goal._id}>
            <Card sx={{
              backgroundColor: '#181c23',
              color: '#f3f4f6',
              borderRadius: 3,
              boxShadow: '0 2px 12px 0 #00000033',
              p: 2,
              minHeight: 180,
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFD600' }}>{goal.title}</Typography>
                  <Chip
                    label={goal.isCompleted ? 'Tamamlandı' : 'Devam Ediyor'}
                    sx={{
                      backgroundColor: goal.isCompleted ? '#10b981' : '#FFD600',
                      color: goal.isCompleted ? '#fff' : '#181c23',
                      fontWeight: 600,
                      fontSize: 14,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      ml: 2,
                    }}
                    size="small"
                  />
                </Box>
                <Typography sx={{ color: '#bdbdbd', mb: 1, fontSize: 16 }}>
                  {goal.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ color: '#bdbdbd', mb: 1, fontWeight: 500 }}>
                    İlerleme: {goal.currentValue} / {goal.targetValue} {goal.unit}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={calculateProgress(goal)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#23272f',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: goal.isCompleted ? '#10b981' : '#FFD600',
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#181c23',
            color: '#f3f4f6',
            borderRadius: 3,
            boxShadow: 24,
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFD600', fontWeight: 'bold', fontSize: 22, background: 'transparent' }}>
          Yeni Hedef Seç
        </DialogTitle>
        <DialogContent sx={{ background: 'transparent', p: 0 }}>
          <List sx={{ background: 'transparent' }}>
            {Object.entries(availableGoals).map(([type, goals]) => (
              <React.Fragment key={type}>
                <ListItem sx={{ background: 'transparent', py: 2 }} disableGutters>
                  <ListItemText
                    primary={
                      <span style={{ color: '#FFD600', fontWeight: 600, fontSize: 18 }}>
                        {type === 'weight' ? 'Kilo Hedefleri' :
                        type === 'workout_streak' ? 'Antrenman Hedefleri' :
                        type === 'distance' ? 'Mesafe Hedefleri' :
                        'Güç Hedefleri'}
                      </span>
                    }
                  />
                </ListItem>
                {goals.map((goal, index) => (
                  <ListItemButton
                    key={index}
                    onClick={() => createGoal(type, index)}
                    sx={{
                      backgroundColor: '#23272f',
                      color: '#f3f4f6',
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: '#FFD600',
                        color: '#181c23',
                      },
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 4px 0 #00000033',
                    }}
                  >
                    <ListItemText
                      primary={<span style={{ fontWeight: 500, fontSize: 16 }}>{goal.title}</span>}
                      secondary={<span style={{ color: '#bdbdbd', fontSize: 14 }}>{goal.description} - {goal.points} puan</span>}
                    />
                  </ListItemButton>
                ))}
                <Divider sx={{ background: '#23272f', my: 1 }} />
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ background: 'transparent', p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#FFD600', fontWeight: 600, fontSize: 16 }}>
            İPTAL
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Goals;
