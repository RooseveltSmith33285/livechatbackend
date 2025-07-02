export default async (req, res) => {
    console.log("CRON JOB TRIGGERED AT:", new Date().toISOString());
    
    // Simple verification
    // if (!req.headers['user-agent']?.includes('vercel-cron')) {
    //   console.log("Unauthorized access attempt");
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }
  
    try {
    //   const response = {
    //     success: true,
    //     message: 'Cron job executed successfully',
    //     timestamp: new Date().toISOString()
    //   };
      
    //   console.log("CRON JOB COMPLETED:", response);
      return res.status(200).json({
        message:"sucess"
      });
      
    } catch (error) {
      console.error('CRON JOB FAILED:', error);
      return res.status(500).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };