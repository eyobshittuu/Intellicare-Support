const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { createReadStream } = require('fs');

const logsDir = path.join(__dirname, '../logs');

// Helper to parse log line
const parseLogLine = (line) => {
  try {
    return JSON.parse(line);
  } catch (error) {
    // If not JSON, return as plain text
    return {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: line,
      service: 'unknown'
    };
  }
};

// Helper to read log file with pagination
const readLogFile = async (filename, options = {}) => {
  const {
    level = null,
    search = null,
    limit = 100,
    offset = 0
  } = options;

  const filePath = path.join(logsDir, filename);
  
  try {
    await fs.access(filePath);
  } catch (error) {
    return { logs: [], total: 0 };
  }

  const logs = [];
  const fileStream = createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  const allLogs = [];

  for await (const line of rl) {
    if (line.trim()) {
      const log = parseLogLine(line);
      
      // Apply filters
      let include = true;
      
      if (level && log.level !== level) {
        include = false;
      }
      
      if (search && !JSON.stringify(log).toLowerCase().includes(search.toLowerCase())) {
        include = false;
      }
      
      if (include) {
        allLogs.push({ ...log, lineNumber: lineNumber++ });
      }
    }
  }

  // Sort by timestamp descending (newest first)
  allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Paginate
  const paginatedLogs = allLogs.slice(offset, offset + limit);

  return {
    logs: paginatedLogs,
    total: allLogs.length
  };
};

// @desc    Get logs
// @route   GET /api/logs
// @access  Private (Super Admin only)
exports.getLogs = async (req, res) => {
  try {
    const {
      type = 'combined', // combined, error, access
      level = null,
      search = null,
      limit = 100,
      page = 1
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const filename = `${type}.log`;

    const result = await readLogFile(filename, {
      level,
      search,
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      type,
      logs: result.logs,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs',
      error: error.message
    });
  }
};

// @desc    Get log statistics
// @route   GET /api/logs/stats
// @access  Private (Super Admin only)
exports.getLogStats = async (req, res) => {
  try {
    const stats = {
      error: 0,
      warn: 0,
      info: 0,
      http: 0,
      total: 0
    };

    // Read combined log file
    const filePath = path.join(logsDir, 'combined.log');
    
    try {
      await fs.access(filePath);
      
      const fileStream = createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        if (line.trim()) {
          const log = parseLogLine(line);
          stats.total++;
          if (stats[log.level] !== undefined) {
            stats[log.level]++;
          }
        }
      }
    } catch (error) {
      // File doesn't exist yet
    }

    // Get file sizes
    const files = ['combined.log', 'error.log', 'access.log'];
    const fileSizes = {};

    for (const file of files) {
      try {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);
        fileSizes[file] = stats.size;
      } catch (error) {
        fileSizes[file] = 0;
      }
    }

    res.json({
      success: true,
      stats,
      fileSizes
    });
  } catch (error) {
    console.error('Get log stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching log statistics',
      error: error.message
    });
  }
};

// @desc    Clear logs
// @route   DELETE /api/logs/:type
// @access  Private (Super Admin only)
exports.clearLogs = async (req, res) => {
  try {
    const { type } = req.params;
    const filename = `${type}.log`;
    const filePath = path.join(logsDir, filename);

    await fs.writeFile(filePath, '');

    res.json({
      success: true,
      message: `${type} logs cleared successfully`
    });
  } catch (error) {
    console.error('Clear logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing logs',
      error: error.message
    });
  }
};

// @desc    Download logs
// @route   GET /api/logs/download/:type
// @access  Private (Super Admin only)
exports.downloadLogs = async (req, res) => {
  try {
    const { type } = req.params;
    const filename = `${type}.log`;
    const filePath = path.join(logsDir, filename);

    await fs.access(filePath);

    res.download(filePath, filename);
  } catch (error) {
    console.error('Download logs error:', error);
    res.status(404).json({
      success: false,
      message: 'Log file not found'
    });
  }
};
