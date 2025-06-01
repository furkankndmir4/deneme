router.post('/request/:userId', authenticateToken, async (req, res) => {
    const requesterId = req.user.id;
    const receiverId = req.params.userId;
  });

  router.get('/requests', authenticateToken, async (req, res) => {
  });
  
  router.post('/accept/:requestId', authenticateToken, async (req, res) => {
  });
  
  router.delete('/reject/:requestId', authenticateToken, async (req, res) => {
  });
  
  router.get('/', authenticateToken, async (req, res) => {
  });
  
  router.delete('/:friendId', authenticateToken, async (req, res) => {
  });