## Release 3.0 Issues
### Production Platform
*  AWS/EC2

### Our steps to configure SDL for AWS/EC2
#### Data Integration
*  Implemented methods to compress, upload, decompress and import large payloads
    *  SDL command line cannot upload large payloads

#### Platform Selection
After analysis and experiments, selected the following AWS/EC2 instance
*  AWS/EC2 family: memory optimized
*  AWS EC2 instance: r4.large
*  CPU: 2
*  Memory: 15.5 GB

#### Test Cases
1.  Uploaded and processed two large payloads
*  NALT: 6.84 MB
*  NCIT: 13.7 MB

2.  No other platform will process either file
*  Google SDTT - exceeds 2.5MB limit
*  Gregg Kellogg hosted SDL bails out
*  no other options

#### Test Results
1.  SDL/AWS/EC2-NALT processed 500,000+ triples in 5 hours
2.  SDL/AWS/EC2-NCIT processed 900,000+ triples in 9 hours

### Business Issues
1.  Must cover cost of running dedicated AWS/EC2 server
2.  Consider Patreon business model where authorized customers access dedicated AWS/EC2 server on-demand
3.  Will need to implement "authorization + authentication + access" process based on Patreon credential
