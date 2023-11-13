## Release 1.0 Issues
### AWS/Lambda limits
1.  Application size/footprint
* 250MB
2.  Application duration/runtime
*  29 seconds
    *  note: AWS/Lambda uses API Gateway
3.  Available AWS/Lambda memory
*  2.5GB

### Our steps to configure SDL for AWS/Lambda
#### Application size/footprint
1.  Process
*  Reduced standard SDL footprint from greater than 300MB to less than 250MB
2.  Implications
*  Limits ability to analyze structured data using ontologies in addition to schema.org
    *  See plans for Release 3.0, 4.0 and 5.0

#### Application duration/runtime
1.  Process
*  Experiment with document size
*  Experiment with structured data complexity (third normal form)
2.  Implications
*  File size limit (third normal form): 490KB
*  File size limit (first normal form): less than 490KB
3.  Comparison
*  Google SDTT file size limit is 2.5MB

### Potential methods to use AWS/Lambda more efficiently
1.  AWS/Lambda memory
*  May be able to malloc up to 10GB
2.  Application size/footprint
*  Remove more non-essential SDL features
3.  Application duration/runtime
*  Implement concurrent/multi-threaded workload
    *  Preliminary experiments with asynchronous processing on AWS/Lambda failed
