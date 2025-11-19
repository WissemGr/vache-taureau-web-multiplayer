#!/bin/bash
#
# GitHub Runner Management Script
# Quick commands to manage the self-hosted runner on 10.100.1.36
#

SERVER="sysadmin@10.100.1.36"
RUNNER_DIR="~/actions-runner"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

case "$1" in
    status)
        echo -e "${BLUE}Checking runner status...${NC}"
        ssh $SERVER "cd $RUNNER_DIR && sudo ./svc.sh status"
        ;;

    start)
        echo -e "${GREEN}Starting runner...${NC}"
        ssh $SERVER "cd $RUNNER_DIR && sudo ./svc.sh start"
        ;;

    stop)
        echo -e "${YELLOW}Stopping runner...${NC}"
        ssh $SERVER "cd $RUNNER_DIR && sudo ./svc.sh stop"
        ;;

    restart)
        echo -e "${YELLOW}Restarting runner...${NC}"
        ssh $SERVER "cd $RUNNER_DIR && sudo ./svc.sh stop && sleep 2 && sudo ./svc.sh start"
        ;;

    logs)
        echo -e "${BLUE}Showing runner logs (Ctrl+C to exit)...${NC}"
        ssh $SERVER "journalctl -u actions.runner.* -f"
        ;;

    info)
        echo -e "${BLUE}Runner Information:${NC}"
        echo "Server: 10.100.1.36"
        echo "User: sysadmin"
        echo "Runner Name: server-10.100.1.36"
        echo "Labels: self-hosted, linux, x64, production"
        echo ""
        ssh $SERVER "cd $RUNNER_DIR && sudo ./svc.sh status"
        ;;

    ssh)
        echo -e "${BLUE}Connecting to server...${NC}"
        ssh $SERVER
        ;;

    *)
        echo "GitHub Runner Management Script"
        echo ""
        echo "Usage: $0 {status|start|stop|restart|logs|info|ssh}"
        echo ""
        echo "Commands:"
        echo "  status   - Check runner status"
        echo "  start    - Start the runner service"
        echo "  stop     - Stop the runner service"
        echo "  restart  - Restart the runner service"
        echo "  logs     - View runner logs (live)"
        echo "  info     - Show runner information"
        echo "  ssh      - SSH into the server"
        echo ""
        exit 1
        ;;
esac
